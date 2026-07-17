#!/usr/bin/env bash
# Deterministic static-site staging for h3x89.github.io.
#
# Copies exactly the allowlisted published site files/directories (the same
# set the Cloudflare Pages workflow stages) into an explicit, empty
# destination directory, then prints a sorted manifest of relative paths and
# byte sizes.
#
# Usage:
#   scripts/stage-static-site.sh <dest-dir>
#
# Env overrides (mainly for tests):
#   STAGE_SOURCE_DIR   - source repo root (default: repo root of this script)
#   STAGE_ALLOWED_DEST_PREFIXES - colon-separated list of extra allowed
#                         destination prefixes, appended to the built-in list
#
# Exit non-zero on any violation. Never prints file contents.

set -euo pipefail

# --- allowlist -------------------------------------------------------------
# Must stay in sync with .github/workflows/cloudflare-pages.yml's
# "Prepare static Pages output" step.
ROOT_FILES=(
  index.html
  RobertKubisResume.pdf
  site.webmanifest
  favicon.ico
  favicon-16x16.png
  favicon-32x32.png
  favicon-48x48.png
  apple-touch-icon.png
  android-chrome-192x192.png
  android-chrome-512x512.png
)

ALLOWED_DIRS=(
  assets
  css
  js
  agentic-sre
  case-studies
  sreagent
)

# Entry files that must exist in the staged output for the site to function.
REQUIRED_STAGED_FILES=(
  index.html
  agentic-sre/index.html
  case-studies/agentic-sre/index.html
  sreagent/index.html
)

# Filename patterns rejected anywhere inside an allowed directory, even
# though only allowlisted paths are walked. Defense in depth against an
# accidental secret/config file landing inside a published directory.
FORBIDDEN_NAME_PATTERNS=(
  '.env'
  '.env.*'
  '.git'
  '.github'
  '.DS_Store'
  'id_rsa*'
  'id_ed25519*'
  '*.pem'
  '*.key'
  '*.pfx'
  'credentials*'
  '.aws'
  '.npmrc'
  '*.tfstate'
  '*.tfvars'
)

usage() {
  echo "Usage: $0 <dest-dir>" >&2
}

fail() {
  echo "stage-static-site: ERROR: $*" >&2
  exit 1
}

if [[ $# -ne 1 ]]; then
  usage
  fail "expected exactly one argument (destination directory)"
fi

DEST_DIR_ARG="$1"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="${STAGE_SOURCE_DIR:-"$(cd "${SCRIPT_DIR}/.." && pwd)"}"
SOURCE_DIR="$(cd "${SOURCE_DIR}" && pwd)"

[[ -d "${SOURCE_DIR}" ]] || fail "source directory does not exist: ${SOURCE_DIR}"

# --- destination validation -------------------------------------------------
if [[ "${DEST_DIR_ARG}" != /* ]]; then
  fail "destination must be an absolute path, got: ${DEST_DIR_ARG}"
fi

if [[ ! -e "${DEST_DIR_ARG}" ]]; then
  mkdir -p "${DEST_DIR_ARG}"
fi

[[ -d "${DEST_DIR_ARG}" ]] || fail "destination exists but is not a directory: ${DEST_DIR_ARG}"

DEST_DIR="$(cd "${DEST_DIR_ARG}" && pwd)"

# Destination must be empty (reject stale content from a previous run).
if [[ -n "$(find "${DEST_DIR}" -mindepth 1 -maxdepth 1 2>/dev/null)" ]]; then
  fail "destination is not empty (stale content): ${DEST_DIR}"
fi

# Destination must live under an expected temporary/build path, and must not
# be inside (or equal to) the source repository.
ALLOWED_DEST_PREFIXES=(
  "${RUNNER_TEMP:-}"
  "${TMPDIR:-}"
  "/tmp"
  "/private/tmp"
  "/var/folders"
)
if [[ -n "${STAGE_ALLOWED_DEST_PREFIXES:-}" ]]; then
  IFS=':' read -r -a EXTRA_PREFIXES <<< "${STAGE_ALLOWED_DEST_PREFIXES}"
  ALLOWED_DEST_PREFIXES+=("${EXTRA_PREFIXES[@]}")
fi

dest_is_allowed=false
for prefix in "${ALLOWED_DEST_PREFIXES[@]}"; do
  [[ -z "${prefix}" ]] && continue
  prefix_real="$(cd "${prefix}" 2>/dev/null && pwd || true)"
  [[ -z "${prefix_real}" ]] && continue
  case "${DEST_DIR}/" in
    "${prefix_real}/"*) dest_is_allowed=true; break ;;
  esac
done
"${dest_is_allowed}" || fail "destination is outside expected temporary/build paths: ${DEST_DIR}"

case "${DEST_DIR}/" in
  "${SOURCE_DIR}/"*|"${SOURCE_DIR}/") fail "destination must not be inside the source repository: ${DEST_DIR}" ;;
esac

# --- helpers -----------------------------------------------------------------

is_forbidden_name() {
  local name="$1"
  local pattern
  for pattern in "${FORBIDDEN_NAME_PATTERNS[@]}"; do
    # shellcheck disable=SC2053
    if [[ "${name}" == ${pattern} ]]; then
      return 0
    fi
  done
  return 1
}

# Check every path segment (not just the final filename) so a forbidden
# name nested at any depth inside an allowlisted directory is caught.
check_forbidden_path() {
  local rel_path="$1"
  local part
  local -a parts
  IFS='/' read -r -a parts <<< "${rel_path}"
  for part in "${parts[@]}"; do
    is_forbidden_name "${part}" && fail "forbidden path segment '${part}' in allowlisted path: ${rel_path}"
  done
  return 0
}

# Verify a symlink at $1 (absolute path) resolves inside SOURCE_DIR.
check_symlink_bounds() {
  local link_path="$1"
  local resolved
  resolved="$(cd "$(dirname "${link_path}")" && realpath -- "$(basename "${link_path}")" 2>/dev/null || true)"
  [[ -n "${resolved}" ]] || fail "unresolvable symlink: ${link_path}"
  case "${resolved}/" in
    "${SOURCE_DIR}/"*|"${SOURCE_DIR}/") ;;
    *) fail "symlink escapes repository: ${link_path} -> ${resolved}" ;;
  esac
}

copy_one_file() {
  local rel_path="$1"
  local src="${SOURCE_DIR}/${rel_path}"
  local dst="${DEST_DIR}/${rel_path}"

  if [[ -L "${src}" ]]; then
    check_symlink_bounds "${src}"
  fi

  check_forbidden_path "${rel_path}"

  [[ -f "${src}" ]] || fail "expected file missing from source: ${rel_path}"

  mkdir -p "$(dirname "${dst}")"
  cp -p "${src}" "${dst}"
}

# --- copy root files ---------------------------------------------------------

for f in "${ROOT_FILES[@]}"; do
  [[ -e "${SOURCE_DIR}/${f}" ]] || fail "required root file missing from source: ${f}"
  copy_one_file "${f}"
done

# --- copy allowed directories (recursive, preserving nested paths) ----------

for d in "${ALLOWED_DIRS[@]}"; do
  src_dir="${SOURCE_DIR}/${d}"
  [[ -d "${src_dir}" ]] || fail "required source directory missing: ${d}"

  while IFS= read -r -d '' entry; do
    rel_path="${entry#"${SOURCE_DIR}"/}"
    copy_one_file "${rel_path}"
  done < <(find "${src_dir}" -type f -print0 -o -type l -print0)
done

# --- verify required entry files staged --------------------------------------

for f in "${REQUIRED_STAGED_FILES[@]}"; do
  [[ -f "${DEST_DIR}/${f}" ]] || fail "required entry file missing from staged output: ${f}"
done

# --- manifest ------------------------------------------------------------------
# Sorted "size<TAB>relative-path" lines. No file contents are ever printed.

find "${DEST_DIR}" -type f -print0 \
  | while IFS= read -r -d '' f; do
      size="$(wc -c < "${f}" | tr -d '[:space:]')"
      rel="${f#"${DEST_DIR}"/}"
      printf '%s\t%s\n' "${size}" "${rel}"
    done \
  | LC_ALL=C sort -k2

exit 0
