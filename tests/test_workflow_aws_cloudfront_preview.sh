#!/usr/bin/env bash
# Static assertions against .github/workflows/aws-cloudfront-preview.yml.
#
# These are text-level checks (not a full workflow execution) that pin down
# review-required properties of the workflow file itself: account-ID
# masking on every AWS OIDC login, the main-ref fail-fast condition on the
# read-only job, and truthful (outcome-derived) deployment-summary
# reporting. Pure bash + grep, no extra dependencies.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKFLOW="${REPO_ROOT}/.github/workflows/aws-cloudfront-preview.yml"

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

[[ -f "${WORKFLOW}" ]] || { echo "workflow file not found: ${WORKFLOW}" >&2; exit 1; }

# --- 1. every configure-aws-credentials step masks the account ID ---------
test_account_id_masked_on_every_login() {
  local uses_count masked_count
  uses_count="$(grep -c 'uses: aws-actions/configure-aws-credentials@' "${WORKFLOW}")"
  masked_count="$(grep -c 'mask-aws-account-id: true' "${WORKFLOW}")"

  if [[ "${uses_count}" -lt 2 ]]; then
    fail_test "every configure-aws-credentials login masks the account ID" \
      "expected at least 2 configure-aws-credentials steps (aws-readonly-check, aws-deploy), found ${uses_count}"
    return
  fi

  if [[ "${masked_count}" -ne "${uses_count}" ]]; then
    fail_test "every configure-aws-credentials login masks the account ID" \
      "found ${uses_count} configure-aws-credentials step(s) but only ${masked_count} mask-aws-account-id: true occurrence(s)"
    return
  fi

  # Confirm mask-aws-account-id: true appears within 5 lines *after* each
  # configure-aws-credentials `uses:` line (i.e. inside that step's `with:`
  # block), not just present somewhere else in the file.
  local line_numbers
  line_numbers="$(grep -n 'uses: aws-actions/configure-aws-credentials@' "${WORKFLOW}" | cut -d: -f1)"
  local ln
  for ln in ${line_numbers}; do
    if ! sed -n "${ln},$((ln + 5))p" "${WORKFLOW}" | grep -q 'mask-aws-account-id: true'; then
      fail_test "every configure-aws-credentials login masks the account ID" \
        "no mask-aws-account-id: true found within the step starting at line ${ln}"
      return
    fi
  done

  pass "every configure-aws-credentials login masks the account ID"
}

# --- 2. aws-readonly-check requires workflow_dispatch AND main ref --------
test_readonly_check_requires_main_ref() {
  local job_block
  job_block="$(awk '/^  aws-readonly-check:/{flag=1} flag && /^  aws-deploy:/{exit} flag' "${WORKFLOW}")"

  if [[ -z "${job_block}" ]]; then
    fail_test "aws-readonly-check job condition requires refs/heads/main" "could not locate aws-readonly-check job block"
    return
  fi

  if echo "${job_block}" | grep -q "github.event_name == 'workflow_dispatch'" \
     && echo "${job_block}" | grep -q "github.ref == 'refs/heads/main'"; then
    pass "aws-readonly-check job condition requires refs/heads/main"
  else
    fail_test "aws-readonly-check job condition requires refs/heads/main" \
      "expected both workflow_dispatch and refs/heads/main checks in the aws-readonly-check if: block"
  fi
}

# --- 3. aws-deploy retains its stronger existing conditions -----------------
test_deploy_job_retains_stronger_conditions() {
  local job_block
  job_block="$(awk '/^  aws-deploy:/{flag=1} flag' "${WORKFLOW}")"

  local ok=true
  for needle in \
    "github.event_name == 'workflow_dispatch'" \
    "github.ref == 'refs/heads/main'" \
    "inputs.mode == 'deploy'" \
    "inputs.confirm_deploy == 'DEPLOY'"; do
    if ! echo "${job_block}" | grep -qF "${needle}"; then
      ok=false
      break
    fi
  done

  if "${ok}"; then
    pass "aws-deploy job retains all four required conditions"
  else
    fail_test "aws-deploy job retains all four required conditions" "missing one or more required if: clauses in aws-deploy"
  fi
}

# --- 4. deployment summary never hardcodes "Invalidation | requested" -----
test_invalidation_summary_not_hardcoded() {
  if grep -qF '| Invalidation | requested |' "${WORKFLOW}"; then
    fail_test "deployment summary does not hardcode an unconditional invalidation claim" \
      "found a literal '| Invalidation | requested |' line"
    return
  fi

  if ! grep -q 'DEPLOY_OUTCOME' "${WORKFLOW}"; then
    fail_test "deployment summary does not hardcode an unconditional invalidation claim" \
      "expected the summary step to branch on the deploy step's outcome (DEPLOY_OUTCOME)"
    return
  fi

  if ! grep -q 'invalidation_status="accepted"' "${WORKFLOW}"; then
    fail_test "deployment summary does not hardcode an unconditional invalidation claim" \
      "expected an explicit 'accepted' branch tied to deploy step success"
    return
  fi

  pass "deployment summary does not hardcode an unconditional invalidation claim"
}

# --- 5. deployment summary reports a non-accepted status on failure -------
test_invalidation_summary_reports_failure_states() {
  if grep -q 'invalidation_status="failed"' "${WORKFLOW}" \
     && grep -q 'invalidation_status="not completed"' "${WORKFLOW}"; then
    pass "deployment summary reports failed/not-completed invalidation states"
  else
    fail_test "deployment summary reports failed/not-completed invalidation states" \
      "expected both a 'failed' and a 'not completed' invalidation_status branch"
  fi
}

test_account_id_masked_on_every_login
test_readonly_check_requires_main_ref
test_deploy_job_retains_stronger_conditions
test_invalidation_summary_not_hardcoded
test_invalidation_summary_reports_failure_states

echo "---"
echo "${TESTS_RUN} tests run, $((TESTS_RUN - TESTS_FAILED)) passed, ${TESTS_FAILED} failed"

if [[ "${TESTS_FAILED}" -ne 0 ]]; then
  exit 1
fi
exit 0
