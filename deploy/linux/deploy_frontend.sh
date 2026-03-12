#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/app/kb}"
APP_USER="${APP_USER:-kbapp}"
APP_GROUP="${APP_GROUP:-kbapp}"
PACKAGE_SOURCE="${PACKAGE_SOURCE:-$APP_ROOT/packages/rag-hub-frontend-dist.tar.gz}"
TARGET_DIR="${TARGET_DIR:-$APP_ROOT/frontend/current}"
BACKUP_ROOT="${BACKUP_ROOT:-$APP_ROOT/backups/frontend}"
NGINX_CONFIG_SOURCE="${NGINX_CONFIG_SOURCE:-$APP_ROOT/deploy/nginx/kb.conf}"
NGINX_CONFIG_TARGET="${NGINX_CONFIG_TARGET:-/etc/nginx/conf.d/rag-hub.conf}"
BACKUP_DIR="$BACKUP_ROOT/$(date +%Y%m%d%H%M%S)"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

pass() {
  echo "[OK] $1"
}

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    fail "please run as root"
  fi
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || fail "missing file: $path"
}

require_root
require_file "$PACKAGE_SOURCE"
require_file "$NGINX_CONFIG_SOURCE"

mkdir -p "$BACKUP_DIR"
if [[ -d "$TARGET_DIR" ]]; then
  cp -a "$TARGET_DIR" "$BACKUP_DIR/current"
  pass "backed up current frontend"
fi

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
tar -xzf "$PACKAGE_SOURCE" -C "$TARGET_DIR"
chown -R "$APP_USER:$APP_GROUP" "$(dirname "$TARGET_DIR")"
pass "frontend files deployed"

cp "$NGINX_CONFIG_SOURCE" "$NGINX_CONFIG_TARGET"
chmod 0644 "$NGINX_CONFIG_TARGET"
nginx -t || fail "nginx config test failed"
systemctl reload nginx
systemctl is-active --quiet nginx.service || fail "nginx.service is not running"
pass "nginx reloaded"

echo "Frontend deployment complete."
echo "BACKUP_DIR=$BACKUP_DIR"
echo "PACKAGE_SOURCE=$PACKAGE_SOURCE"
echo "TARGET_DIR=$TARGET_DIR"
