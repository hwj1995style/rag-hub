#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5174}"
PROXY_TARGET="${PROXY_TARGET:-http://127.0.0.1:8080}"
REPO_ROOT="/mnt/d/Projects/rag-hub"
FRONTEND_DIR="$REPO_ROOT/frontend"
NODE_BIN="${NODE_BIN:-$HOME/.local/node24/bin/node}"
PLAYWRIGHT_EXECUTABLE_PATH="${PLAYWRIGHT_EXECUTABLE_PATH:-/snap/bin/chromium}"

if [[ ! -x "$NODE_BIN" ]]; then
  echo "WSL Node 24 is not installed. Run scripts/bootstrap_frontend_wsl.sh first." >&2
  exit 1
fi

PORT="$PORT" PROXY_TARGET="$PROXY_TARGET" bash "$REPO_ROOT/scripts/start_frontend_wsl.sh" >/dev/null || true

cd "$FRONTEND_DIR"
PLAYWRIGHT_BASE_URL="http://127.0.0.1:${PORT}" PLAYWRIGHT_EXECUTABLE_PATH="$PLAYWRIGHT_EXECUTABLE_PATH" "$NODE_BIN" ./node_modules/@playwright/test/cli.js test "$@"
