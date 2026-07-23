#!/usr/bin/env bash
# Regression tests for the production CloudFront distribution safety
# contract in scripts/aws-readonly-preflight.sh and scripts/deploy-to-aws.sh.
#
# robertkubis.pl / www.robertkubis.pl are live production traffic served by
# this distribution, so both scripts must fail closed unless the
# distribution is already Enabled=true, Status=Deployed, and serving
# exactly the expected production aliases — the inverse of the old
# Phase-1 "must stay disabled" preview contract.
#
# A fake `aws` binary (this file's own directory, prepended to PATH) stands
# in for the real AWS CLI so these tests run without credentials or network
# access. Real `jq` is still used to parse the fake CLI's JSON output,
# exactly as the scripts do against the real API.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PREFLIGHT="${REPO_ROOT}/scripts/aws-readonly-preflight.sh"
DEPLOY="${REPO_ROOT}/scripts/deploy-to-aws.sh"

TESTS_RUN=0
TESTS_FAILED=0

pass() {
  TESTS_RUN=$((TESTS_RUN + 1))
  echo "ok - $1"
}

fail_test() {
  TESTS_RUN=$((TESTS_RUN + 1))
  TESTS_FAILED=$((TESTS_FAILED + 1))
  echo "not ok - $1"
  [[ -n "${2:-}" ]] && echo "  # ${2}"
}

FAKE_BIN_DIR="$(mktemp -d)"
trap 'rm -rf "${FAKE_BIN_DIR}"' EXIT

# Build a fake `aws` covering every subcommand either script calls.
# Controlled entirely through env vars read at call time, so each test
# case just re-exports different FAKE_* values before invoking a script.
cat > "${FAKE_BIN_DIR}/aws" <<'FAKE_AWS'
#!/usr/bin/env bash
set -euo pipefail

case "${1:-} ${2:-}" in
  "sts get-caller-identity")
    echo "arn:aws:sts::123456789012:assumed-role/${FAKE_ROLE_NAME:-robertkubis-preview-github-deploy}/run"
    ;;
  "s3api head-bucket")
    [[ "${FAKE_BUCKET_UNREACHABLE:-0}" == "1" ]] && exit 254
    exit 0
    ;;
  "s3api list-objects-v2")
    echo "${FAKE_OBJECT_COUNT:-0}"
    ;;
  "s3api head-object")
    [[ "${FAKE_ENTRY_MISSING:-0}" == "1" ]] && exit 254
    exit 0
    ;;
  "s3 sync")
    exit 0
    ;;
  "s3 cp")
    exit 0
    ;;
  "cloudfront get-distribution")
    [[ "${FAKE_DIST_MISSING:-0}" == "1" ]] && { echo "An error occurred (NoSuchDistribution)" >&2; exit 254; }
    aliases_json="$(printf '%s' "${FAKE_DIST_ALIASES-robertkubis.pl,www.robertkubis.pl}" \
      | tr ',' '\n' | sed '/^$/d' | jq -R . | jq -s .)"
    cat <<JSON
{
  "Distribution": {
    "Status": "${FAKE_DIST_STATUS:-Deployed}",
    "DomainName": "${FAKE_DIST_DOMAIN-d111111abcdef8.cloudfront.net}",
    "DistributionConfig": {
      "Enabled": ${FAKE_DIST_ENABLED:-true},
      "Aliases": { "Items": ${aliases_json} }
    }
  }
}
JSON
    ;;
  "cloudfront create-invalidation")
    echo "IFAKE0000000000000000000"
    ;;
  "cloudfront get-invalidation")
    echo "${FAKE_INVALIDATION_STATUS:-Completed}"
    ;;
  *)
    echo "fake aws: unhandled invocation: $*" >&2
    exit 1
    ;;
esac
FAKE_AWS
chmod +x "${FAKE_BIN_DIR}/aws"

run_preflight() {
  PATH="${FAKE_BIN_DIR}:${PATH}" \
  AWS_PREVIEW_ROLE_ARN="arn:aws:iam::123456789012:role/robertkubis-preview-github-deploy" \
  AWS_PREVIEW_CONTENT_BUCKET="fake-bucket" \
  AWS_PREVIEW_DISTRIBUTION_ID="EFAKE00000000" \
  AWS_SESSION_TOKEN="fake-session-token" \
  "${@}" "${PREFLIGHT}"
}

# --- 1. Enabled=true + Status=Deployed + matching aliases + domain: PASS --
test_enabled_and_deployed_passes() {
  local out rc
  out="$(run_preflight env FAKE_DIST_ENABLED=true FAKE_DIST_STATUS=Deployed 2>&1)"; rc=$?
  if [[ ${rc} -eq 0 ]] && grep -q "All read-only AWS preflight checks passed." <<<"${out}"; then
    pass "Enabled=true and Status=Deployed passes preflight"
  else
    fail_test "Enabled=true and Status=Deployed passes preflight" "exit=${rc} output=${out}"
  fi
}

# --- 2. Enabled=false: FAIL --------------------------------------------
test_disabled_distribution_fails() {
  local out rc
  out="$(run_preflight env FAKE_DIST_ENABLED=false FAKE_DIST_STATUS=Deployed 2>&1)"; rc=$?
  if [[ ${rc} -ne 0 ]] && grep -q "CloudFront distribution is not enabled" <<<"${out}"; then
    pass "Enabled=false fails preflight with the expected error"
  else
    fail_test "Enabled=false fails preflight with the expected error" "exit=${rc} output=${out}"
  fi
}

# --- 3. Missing/unexpected distribution: FAIL ---------------------------
test_missing_distribution_fails() {
  local out rc
  out="$(run_preflight env FAKE_DIST_MISSING=1 2>&1)"; rc=$?
  if [[ ${rc} -ne 0 ]]; then
    pass "missing distribution fails preflight"
  else
    fail_test "missing distribution fails preflight" "exit=${rc} output=${out}"
  fi
}

# --- 4. Non-Deployed status: FAIL ---------------------------------------
test_non_deployed_status_fails() {
  local out rc
  out="$(run_preflight env FAKE_DIST_ENABLED=true FAKE_DIST_STATUS=InProgress 2>&1)"; rc=$?
  if [[ ${rc} -ne 0 ]] && grep -q "status is not Deployed" <<<"${out}"; then
    pass "non-Deployed status fails preflight with the expected error"
  else
    fail_test "non-Deployed status fails preflight with the expected error" "exit=${rc} output=${out}"
  fi
}

# --- 5. Unexpected alias/domain state: FAIL -----------------------------
test_unexpected_aliases_fail() {
  local out rc
  out="$(run_preflight env FAKE_DIST_ENABLED=true FAKE_DIST_STATUS=Deployed FAKE_DIST_ALIASES="example.com" 2>&1)"; rc=$?
  if [[ ${rc} -ne 0 ]] && grep -q "aliases do not match" <<<"${out}"; then
    pass "unexpected aliases fail preflight with the expected error"
  else
    fail_test "unexpected aliases fail preflight with the expected error" "exit=${rc} output=${out}"
  fi
}

test_missing_domain_fails() {
  local out rc
  out="$(run_preflight env FAKE_DIST_ENABLED=true FAKE_DIST_STATUS=Deployed FAKE_DIST_DOMAIN= 2>&1)"; rc=$?
  if [[ ${rc} -ne 0 ]] && grep -q "no domain name" <<<"${out}"; then
    pass "empty domain name fails preflight with the expected error"
  else
    fail_test "empty domain name fails preflight with the expected error" "exit=${rc} output=${out}"
  fi
}

# --- 6. Post-deployment validation requires the distribution to remain --
#        enabled, Deployed, and serving the same aliases -----------------
make_valid_stage_dir() {
  local dir="$1"
  mkdir -p "${dir}/agentic-sre" "${dir}/case-studies/agentic-sre" "${dir}/sreagent"
  : > "${dir}/index.html"
  : > "${dir}/agentic-sre/index.html"
  : > "${dir}/case-studies/agentic-sre/index.html"
  : > "${dir}/sreagent/index.html"
}

run_deploy() {
  local stage_dir="$1"; shift
  PATH="${FAKE_BIN_DIR}:${PATH}" \
  AWS_PREVIEW_CONTENT_BUCKET="fake-bucket" \
  AWS_PREVIEW_DISTRIBUTION_ID="EFAKE00000000" \
  "${@}" "${DEPLOY}" "${stage_dir}"
}

test_post_deploy_requires_enabled() {
  local stage_dir out rc
  stage_dir="$(mktemp -d)"
  make_valid_stage_dir "${stage_dir}"
  out="$(run_deploy "${stage_dir}" env FAKE_OBJECT_COUNT=4 FAKE_DIST_ENABLED=false FAKE_DIST_STATUS=Deployed 2>&1)"; rc=$?
  rm -rf "${stage_dir}"
  if [[ ${rc} -ne 0 ]] && grep -q "no longer enabled after deployment" <<<"${out}"; then
    pass "post-deployment check fails when the distribution comes back disabled"
  else
    fail_test "post-deployment check fails when the distribution comes back disabled" "exit=${rc} output=${out}"
  fi
}

test_post_deploy_requires_deployed_status() {
  local stage_dir out rc
  stage_dir="$(mktemp -d)"
  make_valid_stage_dir "${stage_dir}"
  out="$(run_deploy "${stage_dir}" env FAKE_OBJECT_COUNT=4 FAKE_DIST_ENABLED=true FAKE_DIST_STATUS=InProgress 2>&1)"; rc=$?
  rm -rf "${stage_dir}"
  if [[ ${rc} -ne 0 ]] && grep -q "status is not Deployed after deployment" <<<"${out}"; then
    pass "post-deployment check fails when the distribution status is not Deployed"
  else
    fail_test "post-deployment check fails when the distribution status is not Deployed" "exit=${rc} output=${out}"
  fi
}

test_post_deploy_succeeds_when_healthy() {
  local stage_dir out rc
  stage_dir="$(mktemp -d)"
  make_valid_stage_dir "${stage_dir}"
  out="$(run_deploy "${stage_dir}" env FAKE_OBJECT_COUNT=4 FAKE_DIST_ENABLED=true FAKE_DIST_STATUS=Deployed 2>&1)"; rc=$?
  rm -rf "${stage_dir}"
  if [[ ${rc} -eq 0 ]] && grep -q "Deployment completed successfully." <<<"${out}"; then
    pass "deployment succeeds end to end when the distribution stays enabled and deployed"
  else
    fail_test "deployment succeeds end to end when the distribution stays enabled and deployed" "exit=${rc} output=${out}"
  fi
}

# --- 7. Neither script can silently mutate infrastructure ---------------
test_no_infrastructure_mutation_calls() {
  local forbidden found=0
  local forbidden_patterns=(
    "cloudfront update-distribution"
    "cloudfront put-distribution-config"
    "cloudfront delete-distribution"
    "route53 "
    "acm "
    "iam "
  )
  for forbidden in "${forbidden_patterns[@]}"; do
    if grep -qF "${forbidden}" "${PREFLIGHT}" "${DEPLOY}"; then
      found=1
      break
    fi
  done
  if [[ "${found}" -eq 0 ]]; then
    pass "neither script contains a Route 53 / ACM / IAM / distribution-config mutation call"
  else
    fail_test "neither script contains a Route 53 / ACM / IAM / distribution-config mutation call" "found forbidden pattern: ${forbidden}"
  fi
}

# --- 8. The old Phase-1 "must stay disabled" contract is gone -----------
test_old_disabled_contract_removed() {
  if grep -qi "is not disabled\|remains disabled\|still disabled\|Enabled}}" "${PREFLIGHT}" "${DEPLOY}"; then
    fail_test "the old Phase-1 disabled-state expectation is no longer present"
    return
  fi
  if grep -q '"Enabled" != "false"\|!= "False"' "${PREFLIGHT}" "${DEPLOY}"; then
    fail_test "the old Phase-1 disabled-state expectation is no longer present" \
      "found a comparison against the old expected-false contract"
    return
  fi
  pass "the old Phase-1 disabled-state expectation is no longer present"
}

test_enabled_and_deployed_passes
test_disabled_distribution_fails
test_missing_distribution_fails
test_non_deployed_status_fails
test_unexpected_aliases_fail
test_missing_domain_fails
test_post_deploy_requires_enabled
test_post_deploy_requires_deployed_status
test_post_deploy_succeeds_when_healthy
test_no_infrastructure_mutation_calls
test_old_disabled_contract_removed

echo "---"
echo "${TESTS_RUN} tests run, $((TESTS_RUN - TESTS_FAILED)) passed, ${TESTS_FAILED} failed"

if [[ "${TESTS_FAILED}" -ne 0 ]]; then
  exit 1
fi
exit 0
