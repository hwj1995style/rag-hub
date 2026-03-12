#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/mnt/d/Projects/rag-hub"
SOURCE_DIR="$REPO_ROOT/frontend"
WORKSPACE_DIR="${WSL_FRONTEND_WORKSPACE:-$HOME/.cache/rag-hub-frontend-workspace}"
NODE_BIN="${NODE_BIN:-$HOME/.local/node24/bin/node}"
NPM_CLI="${NPM_CLI:-$HOME/.local/node24/lib/node_modules/npm/bin/npm-cli.js}"
INSTALL_DEPS="${INSTALL_DEPS:-false}"
export PATH="$(dirname "$NODE_BIN"):$PATH"

if [[ ! -x "$NODE_BIN" ]]; then
  echo "WSL Node 24 is not installed. Run scripts/bootstrap_playwright_wsl.sh first." >&2
  exit 1
fi

if [[ ! -f "$NPM_CLI" ]]; then
  echo "WSL npm CLI is not installed. Run scripts/bootstrap_playwright_wsl.sh first." >&2
  exit 1
fi

rm -rf "$WORKSPACE_DIR"
mkdir -p "$WORKSPACE_DIR"
tar --exclude=node_modules --exclude=dist --exclude=playwright-report --exclude=test-results -cf - -C "$SOURCE_DIR" . | tar -xf - -C "$WORKSPACE_DIR"

cd "$WORKSPACE_DIR"
if [[ "$INSTALL_DEPS" == "true" || ! -d node_modules ]]; then
  "$NODE_BIN" "$NPM_CLI" install
fi

"$NODE_BIN" "$NPM_CLI" run build
rm -rf "$SOURCE_DIR/dist"
mkdir -p "$SOURCE_DIR/dist"
cp -a "$WORKSPACE_DIR/dist"/. "$SOURCE_DIR/dist/"