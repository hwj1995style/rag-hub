#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/app/kb}"
APP_USER="${APP_USER:-kbapp}"
APP_GROUP="${APP_GROUP:-kbapp}"
TARGET_DIR="${TARGET_DIR:-$APP_ROOT/frontend/current}"
BACKUP_ROOT="${BACKUP_ROOT:-$APP_ROOT/backups/frontend}"
LATEST_BACKUP="$(find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d | sort | tail -n 1)"
NGINX_CONFIG_SOURCE="${NGINX_CONFIG_SOURCE:-$APP_ROOT/deploy/nginx/kb.conf}"
NGINX_CONFIG_TARGET="${NGINX_CONFIG_TARGET:-/etc/nginx/conf.d/rag-hub.conf}"

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

require_root
[[ -n "$LATEST_BACKUP" && -d "$LATEST_BACKUP/current" ]] || fail "no frontend backup found"
[[ -f "$NGINX_CONFIG_SOURCE" ]] || fail "missing nginx config source: $NGINX_CONFIG_SOURCE"

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -a "$LATEST_BACKUP/current"/. "$TARGET_DIR"/
chown -R "$APP_USER:$APP_GROUP" "$(dirname "$TARGET_DIR")"
pass "frontend rollback restored"

cp "$NGINX_CONFIG_SOURCE" "$NGINX_CONFIG_TARGET"
chmod 0644 "$NGINX_CONFIG_TARGET"
nginx -t || fail "nginx config test failed"
systemctl reload nginx
systemctl is-active --quiet nginx.service || fail "nginx.service is not running"
pass "nginx reloaded"

echo "Frontend rollback complete."
echo "LATEST_BACKUP=$LATEST_BACKUP"
echo "TARGET_DIR=$TARGET_DIR"
