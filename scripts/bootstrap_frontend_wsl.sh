#!/usr/bin/env bash
set -euo pipefail

NODE_VERSION="${NODE_VERSION:-24.10.0}"
ARCHIVE="node-v${NODE_VERSION}-linux-x64.tar.xz"
URL="https://nodejs.org/dist/v${NODE_VERSION}/${ARCHIVE}"
INSTALL_DIR="${HOME}/.local/node24"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$INSTALL_DIR"
cd "$TMP_DIR"

curl -fsSLO "$URL"
tar -xJf "$ARCHIVE"
rm -rf "$INSTALL_DIR"/*
cp -a "node-v${NODE_VERSION}-linux-x64"/. "$INSTALL_DIR"

"$INSTALL_DIR/bin/node" -v
"$INSTALL_DIR/bin/node" "$INSTALL_DIR/lib/node_modules/npm/bin/npm-cli.js" -v