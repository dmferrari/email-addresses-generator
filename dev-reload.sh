#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
UUID='test-email-addresses@dmferrari'
TARGET_DIR="${HOME}/.local/share/gnome-shell/extensions/${UUID}"

cd "${SCRIPT_DIR}"

glib-compile-schemas schemas

rm -rf "${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"

cp -a \
  extension.js \
  generator.js \
  indicator.js \
  menu-actions.js \
  metadata.json \
  prefs.js \
  storage.js \
  schemas \
  "${TARGET_DIR}/"

gnome-extensions disable "${UUID}" >/dev/null 2>&1 || true
gnome-extensions enable "${UUID}"

printf 'Reloaded %s\n' "${UUID}"
