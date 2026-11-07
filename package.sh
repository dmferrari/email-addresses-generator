#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
UUID='test-email-addresses@dmferrari.github.io'
DIST_DIR="${SCRIPT_DIR}/dist"
BUILD_DIR="${DIST_DIR}/${UUID}"
ARCHIVE_PATH="${DIST_DIR}/${UUID}.shell-extension.zip"

cd "${SCRIPT_DIR}"

rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"
mkdir -p "${DIST_DIR}"

glib-compile-schemas schemas

cp -a \
  extension.js \
  generator.js \
  indicator.js \
  menu-actions.js \
  metadata.json \
  prefs.js \
  storage.js \
  "${BUILD_DIR}/"

mkdir -p "${BUILD_DIR}/schemas"
cp schemas/*.xml "${BUILD_DIR}/schemas/"

SHEXLI=$(command -v shexli || true)
if [ -z "${SHEXLI}" ] && [ -x "${SCRIPT_DIR}/.venv-shexli/bin/shexli" ]; then
  SHEXLI="${SCRIPT_DIR}/.venv-shexli/bin/shexli"
fi

if [ -z "${SHEXLI}" ]; then
  printf '%s\n' 'shexli is required to validate the extension before packaging.' >&2
  printf '%s\n' 'Install it with: python3 -m pip install --user shexli' >&2
  exit 1
fi

ANALYSIS_FILE=$(mktemp)
trap 'rm -f "${ANALYSIS_FILE}"' EXIT HUP INT TERM
"${SHEXLI}" "${BUILD_DIR}" --format json >"${ANALYSIS_FILE}"

python3 - "${ANALYSIS_FILE}" "${BUILD_DIR}/metadata.json" <<'PY'
import json
import sys

with open(sys.argv[1], encoding='utf-8') as analysis_file:
    result = json.load(analysis_file)
with open(sys.argv[2], encoding='utf-8') as metadata_file:
    metadata = json.load(metadata_file)

findings = result.get('findings', [])
errors = [finding for finding in findings
          if finding.get('severity') == 'error']
known_gnome_51_false_positive = (
    '51' in metadata.get('shell-version', [])
    and errors
    and all(finding.get('rule_id') == 'EGO-M-004' for finding in errors)
)

if errors and not known_gnome_51_false_positive:
    for finding in errors:
        print(f"ERROR {finding.get('rule_id')}: {finding.get('message')}",
              file=sys.stderr)
    sys.exit(1)

if known_gnome_51_false_positive:
    print('Ignoring Shexli EGO-M-004 for GNOME 51: analyzer currently flags '
          'the stable release as implausibly future.', file=sys.stderr)

if result.get('summary', {}).get('status') == 'issues_found':
    for finding in findings:
        if finding.get('severity') != 'error':
            print(f"{finding.get('severity', 'info').upper()} "
                  f"{finding.get('rule_id')}: {finding.get('message')}")
PY

rm -f "${ARCHIVE_PATH}"
(
  cd "${BUILD_DIR}"
  zip -qr "${ARCHIVE_PATH}" .
)

printf 'Built %s\n' "${ARCHIVE_PATH}"
