#!/usr/bin/env bash
set -e

if [ -d ".venv" ]; then
  PYTHON="./.venv/bin/python"
elif [ -x "/app/.venv/bin/python" ]; then
  PYTHON="/app/.venv/bin/python"
else
  python -m venv .venv
  ./.venv/bin/pip install -r requirements.txt
  PYTHON="./.venv/bin/python"
fi

exec "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
