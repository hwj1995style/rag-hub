#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5174}"
REPO_ROOT="/mnt/d/Projects/rag-hub"
PID_FILE="$REPO_ROOT/.runtime/wsl-frontend-${PORT}.pid"
VITE_PATTERN="node_modules/vite/bin/vite.js --host 0.0.0.0 --port ${PORT}"

pid="none"
if pgrep -f "$VITE_PATTERN" >/dev/null 2>&1; then
  pid="$(pgrep -f "$VITE_PATTERN" | tail -n 1)"
  echo "$pid" > "$PID_FILE"
  echo "pid:$pid"
  echo 'process:running'
else
  if [[ -f "$PID_FILE" ]]; then
    pid="$(cat "$PID_FILE")"
  fi
  echo "pid:$pid"
  echo 'process:stopped'
fi