#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5174}"
PROXY_TARGET="${PROXY_TARGET:-http://127.0.0.1:8080}"
REPO_ROOT="/mnt/d/Projects/rag-hub"
FRONTEND_DIR="$REPO_ROOT/frontend"
RUNTIME_DIR="$REPO_ROOT/.runtime"
LOG_DIR="$RUNTIME_DIR/logs"
PID_FILE="$RUNTIME_DIR/wsl-frontend-${PORT}.pid"
OUT_LOG="$LOG_DIR/wsl-frontend-${PORT}.out.log"
ERR_LOG="$LOG_DIR/wsl-frontend-${PORT}.err.log"
NODE_BIN="$HOME/.local/node24/bin/node"
VITE_ENTRY="./node_modules/vite/bin/vite.js"
VITE_PATTERN="node_modules/vite/bin/vite.js --host 0.0.0.0 --port ${PORT}"

mkdir -p "$LOG_DIR"
export PATH="$HOME/.local/node24/bin:$PATH"

if [[ ! -x "$NODE_BIN" ]]; then
  echo "WSL Node 24 is not installed. Run scripts/bootstrap_frontend_wsl.sh first." >&2
  exit 1
fi

if [[ -d "$FRONTEND_DIR/node_modules/@esbuild/win32-x64" ]]; then
  echo 'windows-esbuild-detected' >&2
  exit 1
fi

if pgrep -f "$VITE_PATTERN" >/dev/null 2>&1; then
  pgrep -f "$VITE_PATTERN" | tail -n 1 > "$PID_FILE"
  echo "already-running:$(cat "$PID_FILE")"
  exit 0
fi

cd "$FRONTEND_DIR"
setsid env VITE_API_PROXY_TARGET="$PROXY_TARGET" "$NODE_BIN" "$VITE_ENTRY" --host 0.0.0.0 --port "$PORT" --strictPort >"$OUT_LOG" 2>"$ERR_LOG" </dev/null &
echo "$!" > "$PID_FILE"
sleep 2
if ! kill -0 "$(cat "$PID_FILE")" >/dev/null 2>&1; then
  echo "start-failed" >&2
  tail -n 20 "$ERR_LOG" >&2 || true
  exit 1
fi
if ! pgrep -f "$VITE_PATTERN" >/dev/null 2>&1; then
  echo "start-failed" >&2
  tail -n 20 "$ERR_LOG" >&2 || true
  exit 1
fi
echo "started:$(cat "$PID_FILE")"