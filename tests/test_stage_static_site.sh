#!/usr/bin/env bash
# Test suite for scripts/stage-static-site.sh.
#
# Pure bash + POSIX tools only (no bats dependency) so it runs unmodified in
# CI. Each test builds an isolated fixture source tree, runs the staging
# script against it, and asserts on exit status / staged output.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE_SCRIPT="${REPO_ROOT}/scripts/stage-static-site.sh"

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

# Build a minimal, fully valid fixture source tree matching the allowlist.
make_valid_fixture() {
  local dir="$1"
  : > "${dir}/index.html"
  : > "${dir}/RobertKubisResume.pdf"
  : > "${dir}/site.webmanifest"
  : > "${dir}/favicon.ico"
  : > "${dir}/favicon-16x16.png"
  : > "${dir}/favicon-32x32.png"
  : > "${dir}/favicon-48x48.png"
  : > "${dir}/apple-touch-icon.png"
  : > "${dir}/android-chrome-192x192.png"
  : > "${dir}/android-chrome-512x512.png"

  mkdir -p "${dir}/assets/images"
  echo "asset" > "${dir}/assets/images/pic.png"

  mkdir -p "${dir}/css"
  echo "body{}" > "${dir}/css/main.css"

  mkdir -p "${dir}/js"
  echo "console.log(1)" > "${dir}/js/app.js"

  mkdir -p "${dir}/agentic-sre"
  echo "<html></html>" > "${dir}/agentic-sre/index.html"

  mkdir -p "${dir}/case-studies/agentic-sre/assets"
  echo "<html></html>" > "${dir}/case-studies/agentic-sre/index.html"
  echo "css" > "${dir}/case-studies/agentic-sre/agentic-sre.css"
  echo "img" > "${dir}/case-studies/agentic-sre/assets/preview.png"

  mkdir -p "${dir}/sreagent"
  echo "<html></html>" > "${dir}/sreagent/index.html"

  # Files present in the source tree but outside the allowlist entirely
  # (must never be staged, and must never even be inspected as a violation
  # since the script only walks allowlisted paths).
  : > "${dir}/.env"
  mkdir -p "${dir}/.github/workflows"
  : > "${dir}/.github/workflows/ci.yml"
}

new_tmp() {
  mktemp -d
}

run_stage() {
  local src="$1"
  local dest="$2"
  STAGE_SOURCE_DIR="${src}" "${STAGE_SCRIPT}" "${dest}"
}

# --- 1. expected root files are staged --------------------------------------
test_expected_root_files_staged() {
  local src dest
  src="$(new_tmp)"; dest="$(new_tmp)"
  make_valid_fixture "${src}"

  if run_stage "${src}" "${dest}" > "${dest}.manifest" 2>"${dest}.err"; then
    if [[ -f "${dest}/index.html" && -f "${dest}/RobertKubisResume.pdf" && -f "${dest}/site.webmanifest" ]]; then
      pass "expected root files staged"
    else
      fail_test "expected root files staged" "root files missing from staged output"
    fi
  else
    fail_test "expected root files staged" "$(cat "${dest}.err")"
  fi
  rm -rf "${src}" "${dest}" "${dest}.manifest" "${dest}.err"
}

# --- 2. nested case-study content preserved ---------------------------------
test_nested_case_study_content_preserved() {
  local src dest
  src="$(new_tmp)"; dest="$(new_tmp)"
  make_valid_fixture "${src}"

  if run_stage "${src}" "${dest}" > "${dest}.manifest" 2>"${dest}.err"; then
    if [[ -f "${dest}/case-studies/agentic-sre/assets/preview.png" ]]; then
      pass "nested case-study content preserved"
    else
      fail_test "nested case-study content preserved" "nested asset missing from staged output"
    fi
  else
    fail_test "nested case-study content preserved" "$(cat "${dest}.err")"
  fi
  rm -rf "${src}" "${dest}" "${dest}.manifest" "${dest}.err"
}

# --- 3. missing required file fails -----------------------------------------
test_missing_required_file_fails() {
  local src dest
  src="$(new_tmp)"; dest="$(new_tmp)"
  make_valid_fixture "${src}"
  rm -f "${src}/sreagent/index.html"

  if run_stage "${src}" "${dest}" > "${dest}.manifest" 2>"${dest}.err"; then
    fail_test "missing required entry file fails" "expected non-zero exit"
  else
    if grep -q "sreagent/index.html" "${dest}.err"; then
      pass "missing required entry file fails"
    else
      fail_test "missing required entry file fails" "error did not mention missing file: $(cat "${dest}.err")"
    fi
  fi
  rm -rf "${src}" "${dest}" "${dest}.manifest" "${dest}.err"
}

# --- 4. forbidden .env nested inside an allowed dir is rejected ------------
test_forbidden_env_rejected() {
  local src dest
  src="$(new_tmp)"; dest="$(new_tmp)"
  make_valid_fixture "${src}"
  echo "SECRET=1" > "${src}/assets/.env"

  if run_stage "${src}" "${dest}" > "${dest}.manifest" 2>"${dest}.err"; then
    fail_test "forbidden .env rejected" "expected non-zero exit"
  else
    if grep -q "forbidden" "${dest}.err"; then
      pass "forbidden .env rejected"
    else
      fail_test "forbidden .env rejected" "error did not mention forbidden path: $(cat "${dest}.err")"
    fi
  fi
  rm -rf "${src}" "${dest}" "${dest}.manifest" "${dest}.err"
}

# --- 5. forbidden .github nested inside an allowed dir is rejected --------
test_forbidden_github_rejected() {
  local src dest
  src="$(new_tmp)"; dest="$(new_tmp)"
  make_valid_fixture "${src}"
  mkdir -p "${src}/case-studies/.github/workflows"
  : > "${src}/case-studies/.github/workflows/injected.yml"

  if run_stage "${src}" "${dest}" > "${dest}.manifest" 2>"${dest}.err"; then
    fail_test "forbidden .github rejected" "expected non-zero exit"
  else
    if grep -q "forbidden" "${dest}.err"; then
      pass "forbidden .github rejected"
    else
      fail_test "forbidden .github rejected" "error did not mention forbidden path: $(cat "${dest}.err")"
    fi
  fi
  rm -rf "${src}" "${dest}" "${dest}.manifest" "${dest}.err"
}

# --- 6. stale (non-empty) destination content is rejected ------------------
test_stale_destination_rejected() {
  local src dest
  src="$(new_tmp)"; dest="$(new_tmp)"
  make_valid_fixture "${src}"
  : > "${dest}/leftover-from-previous-run.txt"

  if run_stage "${src}" "${dest}" > "${dest}.manifest" 2>"${dest}.err"; then
    fail_test "stale destination content rejected" "expected non-zero exit"
  else
    if grep -qi "not empty\|stale" "${dest}.err"; then
      pass "stale destination content rejected"
    else
      fail_test "stale destination content rejected" "error did not mention stale/non-empty: $(cat "${dest}.err")"
    fi
  fi
  rm -rf "${src}" "${dest}" "${dest}.manifest" "${dest}.err"
}

# --- 7. symlink escaping the repository is rejected -------------------------
test_symlink_escape_rejected() {
  local src dest outside
  src="$(new_tmp)"; dest="$(new_tmp)"; outside="$(new_tmp)"
  make_valid_fixture "${src}"
  echo "outside-content" > "${outside}/secret.txt"
  ln -s "${outside}/secret.txt" "${src}/assets/escape-link.txt"

  if run_stage "${src}" "${dest}" > "${dest}.manifest" 2>"${dest}.err"; then
    fail_test "symlink escaping repository rejected" "expected non-zero exit"
  else
    if grep -qi "symlink" "${dest}.err"; then
      pass "symlink escaping repository rejected"
    else
      fail_test "symlink escaping repository rejected" "error did not mention symlink: $(cat "${dest}.err")"
    fi
  fi
  rm -rf "${src}" "${dest}" "${outside}" "${dest}.manifest" "${dest}.err"
}

# --- 8. manifest output is deterministic and sorted -------------------------
test_manifest_deterministic_sorted() {
  local src dest1 dest2 m1 m2
  src="$(new_tmp)"; dest1="$(new_tmp)"; dest2="$(new_tmp)"
  make_valid_fixture "${src}"

  m1="$(run_stage "${src}" "${dest1}" 2>"${dest1}.err")"
  m2="$(run_stage "${src}" "${dest2}" 2>"${dest2}.err")"

  if [[ -z "${m1}" ]]; then
    fail_test "manifest output is deterministic and sorted" "first run produced no manifest: $(cat "${dest1}.err")"
  elif [[ "${m1}" != "${m2}" ]]; then
    fail_test "manifest output is deterministic and sorted" "manifest differs between two runs of the same source"
  else
    local sorted
    sorted="$(printf '%s\n' "${m1}" | LC_ALL=C sort -k2)"
    if [[ "${m1}" == "${sorted}" ]]; then
      pass "manifest output is deterministic and sorted"
    else
      fail_test "manifest output is deterministic and sorted" "manifest lines are not sorted by path"
    fi
  fi
  rm -rf "${src}" "${dest1}" "${dest2}" "${dest1}.err" "${dest2}.err"
}

# --- 9. destination nested inside the source repository is rejected --------
test_destination_inside_source_rejected() {
  local src dest
  src="$(new_tmp)"
  dest="${src}/not-a-temp-dir-child"
  mkdir -p "${dest}"
  make_valid_fixture "${src}"

  if STAGE_SOURCE_DIR="${src}" STAGE_ALLOWED_DEST_PREFIXES="" "${STAGE_SCRIPT}" "${src}/nested-in-source" >/dev/null 2>"${dest}.err"; then
    fail_test "destination inside source repo rejected" "expected non-zero exit"
  else
    pass "destination inside source repo rejected"
  fi
  rm -rf "${src}"
}

test_expected_root_files_staged
test_nested_case_study_content_preserved
test_missing_required_file_fails
test_forbidden_env_rejected
test_forbidden_github_rejected
test_stale_destination_rejected
test_symlink_escape_rejected
test_manifest_deterministic_sorted
test_destination_inside_source_rejected

echo "---"
echo "${TESTS_RUN} tests run, $((TESTS_RUN - TESTS_FAILED)) passed, ${TESTS_FAILED} failed"

if [[ "${TESTS_FAILED}" -ne 0 ]]; then
  exit 1
fi
exit 0
