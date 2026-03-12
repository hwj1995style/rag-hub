#!/usr/bin/env bash
set -euo pipefail

HOST_BACKEND_URL="${HOST_BACKEND_URL:-}"
PORT="${PORT:-5174}"
REPO_ROOT="/mnt/d/Projects/rag-hub"
NODE_BIN="${NODE_BIN:-$HOME/.local/node24/bin/node}"
PLAYWRIGHT_EXECUTABLE_PATH="${PLAYWRIGHT_EXECUTABLE_PATH:-/snap/bin/chromium}"

if [[ -z "$HOST_BACKEND_URL" ]]; then
  echo "HOST_BACKEND_URL is required, for example: http://192.168.1.10:8080" >&2
  exit 1
fi

if [[ ! -x "$NODE_BIN" ]]; then
  echo "WSL Node 24 is not installed. Run scripts/bootstrap_frontend_wsl.sh first." >&2
  exit 1
fi

PORT="$PORT" PROXY_TARGET="$HOST_BACKEND_URL" bash "$REPO_ROOT/scripts/start_frontend_wsl.sh" >/dev/null || true

cd "$REPO_ROOT/frontend"
PLAYWRIGHT_BASE_URL="http://127.0.0.1:${PORT}" PLAYWRIGHT_EXECUTABLE_PATH="$PLAYWRIGHT_EXECUTABLE_PATH" "$NODE_BIN" ./node_modules/@playwright/test/cli.js test "$@"