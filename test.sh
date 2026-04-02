#!/usr/bin/env sh

set -eu

glib-compile-schemas --strict --dry-run schemas
gjs -m tests/run-tests.js
