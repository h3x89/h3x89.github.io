#!/usr/bin/env bash
# Guarded content deployment: sync the staged package to the private S3
# bucket and invalidate the CloudFront distribution. Never enables the
# distribution, never touches DNS, never changes the bucket policy or
# encryption settings. Never prints account IDs, ARNs, bucket names,
# distribution IDs, or raw AWS API JSON.
#
# Usage:
#   scripts/deploy-to-aws.sh <staged-dir>
#
# Required env:
#   AWS_PREVIEW_CONTENT_BUCKET
#   AWS_PREVIEW_DISTRIBUTION_ID

set -euo pipefail

: "${AWS_PREVIEW_CONTENT_BUCKET:?AWS_PREVIEW_CONTENT_BUCKET must be set}"
: "${AWS_PREVIEW_DISTRIBUTION_ID:?AWS_PREVIEW_DISTRIBUTION_ID must be set}"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <staged-dir>" >&2
  exit 1
fi

STAGE_DIR="$1"
[[ -d "${STAGE_DIR}" ]] || { echo "::error::Staged directory does not exist: ${STAGE_DIR}" >&2; exit 1; }

DEST="s3://${AWS_PREVIEW_CONTENT_BUCKET}"

echo "Syncing staged package to the content bucket..."
# Single authoritative sync with a short-lived, non-immutable cache policy.
# Filenames are not content-addressed, so nothing is marked immutable.
aws s3 sync "${STAGE_DIR}" "${DEST}" \
  --delete \
  --only-show-errors \
  --cache-control "public, max-age=300, must-revalidate"

# Override HTML entry points with a no-cache policy so navigation always
# picks up the latest deployed markup.
aws s3 cp "${STAGE_DIR}" "${DEST}" \
  --recursive \
  --exclude "*" \
  --include "*.html" \
  --metadata-directive REPLACE \
  --cache-control "no-cache, must-revalidate" \
  --only-show-errors

echo "OK: content sync completed."

# Verify staged file count matches bucket object count after sync.
local_count="$(find "${STAGE_DIR}" -type f | wc -l | tr -d '[:space:]')"
bucket_count="$(aws s3api list-objects-v2 \
  --bucket "${AWS_PREVIEW_CONTENT_BUCKET}" \
  --query 'length(Contents || `[]`)' \
  --output text)"

if [[ "${local_count}" != "${bucket_count}" ]]; then
  echo "::error::Staged file count (${local_count}) does not match bucket object count (${bucket_count}) after sync." >&2
  exit 1
fi
echo "OK: bucket object count matches staged file count (${bucket_count})."

# Verify required entry files landed in the bucket.
for entry in index.html agentic-sre/index.html case-studies/agentic-sre/index.html sreagent/index.html; do
  if ! aws s3api head-object --bucket "${AWS_PREVIEW_CONTENT_BUCKET}" --key "${entry}" >/dev/null 2>&1; then
    echo "::error::Required entry file missing from bucket after sync: ${entry}" >&2
    exit 1
  fi
done
echo "OK: all required entry files are present in the bucket."

echo "Creating CloudFront invalidation..."
invalidation_id="$(aws cloudfront create-invalidation \
  --distribution-id "${AWS_PREVIEW_DISTRIBUTION_ID}" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)"

invalidation_status="$(aws cloudfront get-invalidation \
  --distribution-id "${AWS_PREVIEW_DISTRIBUTION_ID}" \
  --id "${invalidation_id}" \
  --query 'Invalidation.Status' \
  --output text)"
unset invalidation_id

case "${invalidation_status}" in
  InProgress|Completed)
    echo "OK: CloudFront invalidation was accepted (status: ${invalidation_status})."
    ;;
  *)
    echo "::error::CloudFront invalidation was not accepted." >&2
    exit 1
    ;;
esac
unset invalidation_status

# Confirm the distribution is still disabled after deployment.
dist_enabled="$(aws cloudfront get-distribution \
  --id "${AWS_PREVIEW_DISTRIBUTION_ID}" \
  --query 'Distribution.DistributionConfig.Enabled' \
  --output text)"

if [[ "${dist_enabled}" != "False" && "${dist_enabled}" != "false" ]]; then
  echo "::error::CloudFront distribution is no longer disabled after deployment." >&2
  exit 1
fi
echo "OK: CloudFront distribution remains disabled after deployment."

echo "DEPLOY_STAGED_FILE_COUNT=${local_count}"
echo "DEPLOY_STAGED_BYTES=$(find "${STAGE_DIR}" -type f -exec wc -c {} + | tail -n1 | awk '{print $1}')"
echo "Deployment completed successfully."
