#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5174}"
REPO_ROOT="/mnt/d/Projects/rag-hub"
PID_FILE="$REPO_ROOT/.runtime/wsl-frontend-${PORT}.pid"
VITE_PATTERN="node_modules/.bin/vite --host 0.0.0.0 --port ${PORT}"

pid="none"
if pgrep -f "$VITE_PATTERN" >/dev/null 2>&1; then
  pid="$(pgrep -f "$VITE_PATTERN" | tail -n 1)"
  kill "$pid" >/dev/null 2>&1 || true
  sleep 1
  kill -9 "$pid" >/dev/null 2>&1 || true
fi

pkill -f "$VITE_PATTERN" >/dev/null 2>&1 || true
rm -f "$PID_FILE"
echo "stopped:$pid"