#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then cp .env.example .env; fi
if command -v uv >/dev/null 2>&1; then
  if [ ! -d .venv ]; then uv venv .venv; fi
  uv pip sync --python .venv/bin/python requirements.lock
else
  if [ ! -d .venv ]; then python3 -m venv .venv; fi
  .venv/bin/python -m ensurepip --upgrade
  .venv/bin/python -m pip install -r requirements.lock
fi
npm ci
cleanup() { kill "${elo_api_pid:-}" "${elo_web_pid:-}" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
.venv/bin/python -m uvicorn backend.main:app --env-file .env --host 127.0.0.1 --port 8010 &
elo_api_pid=$!
npm run dev -- --host 127.0.0.1 --port 5173 &
elo_web_pid=$!
wait -n
