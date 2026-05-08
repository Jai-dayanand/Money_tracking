#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REQ_FILE="$SCRIPT_DIR/requirements.txt"
VENV_DIR="$SCRIPT_DIR/.venv"

if [ -x "$VENV_DIR/bin/python" ]; then
  PYTHON="$VENV_DIR/bin/python"
elif [ -x "/app/.venv/bin/python" ]; then
  PYTHON="/app/.venv/bin/python"
else
  python -m venv "$VENV_DIR"
  PYTHON="$VENV_DIR/bin/python"
  "$PYTHON" -m pip install -r "$REQ_FILE"
fi

exec "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
