#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

export PYTHONUNBUFFERED=1
export DJANGO_SETTINGS_MODULE="fundi.settings"

if command -v coverage >/dev/null 2>&1; then
  coverage run manage.py test "$@"
  coverage report
else
  python manage.py test "$@"
fi
