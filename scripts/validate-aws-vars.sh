#!/usr/bin/env bash
# Fail-closed validation of the four required AWS preview repository
# variables. Confirms each is non-empty and syntactically plausible without
# ever printing the values themselves.
#
# Required env:
#   AWS_PREVIEW_ROLE_ARN
#   AWS_PREVIEW_REGION
#   AWS_PREVIEW_CONTENT_BUCKET
#   AWS_PREVIEW_DISTRIBUTION_ID

set -euo pipefail

fail=0

check() {
  local name="$1" value="$2" pattern="$3"
  if [[ -z "${value}" ]]; then
    echo "::error::Repository variable ${name} is not set."
    fail=1
    return
  fi
  if ! [[ "${value}" =~ ${pattern} ]]; then
    echo "::error::Repository variable ${name} does not match the expected format."
    fail=1
    return
  fi
  echo "Repository variable ${name} is set and syntactically plausible."
}

check "AWS_PREVIEW_ROLE_ARN" "${AWS_PREVIEW_ROLE_ARN:-}" '^arn:aws:iam::[0-9]{12}:role/[A-Za-z0-9+=,.@_/-]+$'
check "AWS_PREVIEW_REGION" "${AWS_PREVIEW_REGION:-}" '^[a-z]{2}-[a-z]+-[0-9]$'
check "AWS_PREVIEW_CONTENT_BUCKET" "${AWS_PREVIEW_CONTENT_BUCKET:-}" '^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$'
check "AWS_PREVIEW_DISTRIBUTION_ID" "${AWS_PREVIEW_DISTRIBUTION_ID:-}" '^[A-Z0-9]{10,20}$'

if [[ "${fail}" -ne 0 ]]; then
  echo "::error::One or more required repository variables are missing or invalid. See knowledge/runbook for how to configure them." >&2
  exit 1
fi

exit 0
