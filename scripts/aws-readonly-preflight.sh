#!/usr/bin/env bash
# Read-only AWS preflight checks for the CloudFront preview stack.
#
# Confirms the assumed OIDC role, target bucket, and target CloudFront
# distribution are in the expected state. Never mutates any AWS resource.
# Never prints account IDs, ARNs, bucket names, distribution IDs, or raw
# AWS API JSON — only sanitized pass/fail lines.
#
# Required env:
#   AWS_PREVIEW_ROLE_ARN
#   AWS_PREVIEW_CONTENT_BUCKET
#   AWS_PREVIEW_DISTRIBUTION_ID

set -euo pipefail

: "${AWS_PREVIEW_ROLE_ARN:?AWS_PREVIEW_ROLE_ARN must be set}"
: "${AWS_PREVIEW_CONTENT_BUCKET:?AWS_PREVIEW_CONTENT_BUCKET must be set}"
: "${AWS_PREVIEW_DISTRIBUTION_ID:?AWS_PREVIEW_DISTRIBUTION_ID must be set}"

echo "Running read-only AWS preflight checks..."

# 1. Confirm the caller identity resolves and matches the expected role.
caller_arn="$(aws sts get-caller-identity --query 'Arn' --output text)"
expected_role_name="${AWS_PREVIEW_ROLE_ARN##*/}"
case "${caller_arn}" in
  *"assumed-role/${expected_role_name}/"*)
    echo "OK: caller identity resolves and matches the expected preview deployment role."
    ;;
  *)
    echo "::error::Assumed principal does not match the expected preview deployment role." >&2
    exit 1
    ;;
esac
unset caller_arn

# 2. Confirm no static AWS credentials are present in the environment
#    (only short-lived OIDC-issued session credentials are expected).
if [[ -n "${AWS_SESSION_TOKEN:-}" ]]; then
  echo "OK: session is backed by a temporary token (no static credentials)."
else
  echo "::error::No AWS session token present; refusing to proceed with static-looking credentials." >&2
  exit 1
fi

# 3. Confirm the target bucket is reachable.
if aws s3api head-bucket --bucket "${AWS_PREVIEW_CONTENT_BUCKET}" >/dev/null 2>&1; then
  echo "OK: target content bucket is reachable."
else
  echo "::error::Target content bucket is not reachable." >&2
  exit 1
fi

# 4. Confirm the bucket's current object count (informational only — the
#    bucket is expected to be empty ahead of the first deployment, but this
#    check must not hard-fail once content has been deployed in a later run).
object_count="$(aws s3api list-objects-v2 \
  --bucket "${AWS_PREVIEW_CONTENT_BUCKET}" \
  --query 'length(Contents || `[]`)' \
  --output text)"
echo "INFO: content bucket currently holds ${object_count} object(s)."

# 5. Confirm the CloudFront distribution exists, is disabled, and has a
#    domain name — without printing the distribution ID or domain itself.
dist_json="$(aws cloudfront get-distribution --id "${AWS_PREVIEW_DISTRIBUTION_ID}")"
dist_enabled="$(echo "${dist_json}" | jq -r '.Distribution.DistributionConfig.Enabled')"
dist_domain="$(echo "${dist_json}" | jq -r '.Distribution.DomainName')"
unset dist_json

if [[ "${dist_enabled}" != "false" ]]; then
  echo "::error::CloudFront distribution is not disabled." >&2
  exit 1
fi
echo "OK: CloudFront distribution exists and remains disabled."

if [[ -z "${dist_domain}" || "${dist_domain}" == "null" ]]; then
  echo "::error::CloudFront distribution has no domain name." >&2
  exit 1
fi
echo "OK: CloudFront distribution domain name is available."
unset dist_enabled dist_domain

echo "All read-only AWS preflight checks passed."
