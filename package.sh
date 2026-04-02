#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
UUID='test-email-addresses@dmferrari'
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
  schemas \
  "${BUILD_DIR}/"

rm -f "${ARCHIVE_PATH}"
(
  cd "${BUILD_DIR}"
  zip -qr "${ARCHIVE_PATH}" .
)

printf 'Built %s\n' "${ARCHIVE_PATH}"
