#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/app/kb}"
APP_USER="${APP_USER:-kbapp}"
APP_GROUP="${APP_GROUP:-kbapp}"
TARGET_JAR="${TARGET_JAR:-$APP_ROOT/backend/rag-hub-backend.jar}"
BACKUP_ROOT="${BACKUP_ROOT:-$APP_ROOT/backups/backend}"
SERVICE_NAME="${SERVICE_NAME:-rag-hub-backend.service}"
ROLLBACK_SOURCE="${ROLLBACK_SOURCE:-}"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

pass() {
  echo "[OK] $1"
}

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    fail "请使用 root 用户执行"
  fi
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || fail "文件不存在：$path"
}

latest_backup() {
  find "$BACKUP_ROOT" -type f -name 'rag-hub-backend.jar' | sort | tail -n 1
}

require_root

if [[ -z "$ROLLBACK_SOURCE" ]]; then
  ROLLBACK_SOURCE="$(latest_backup)"
fi

require_file "$ROLLBACK_SOURCE"
mkdir -p "$(dirname "$TARGET_JAR")"
cp "$ROLLBACK_SOURCE" "$TARGET_JAR"
chown "$APP_USER:$APP_GROUP" "$TARGET_JAR"
chmod 0644 "$TARGET_JAR"
pass "backend 包已回滚"

systemctl restart "$SERVICE_NAME"
systemctl is-active --quiet "$SERVICE_NAME" || fail "$SERVICE_NAME 回滚后启动失败"
pass "$SERVICE_NAME 运行正常"

echo "Backend 回滚完成。"
echo "ROLLBACK_SOURCE=$ROLLBACK_SOURCE"
echo "TARGET_JAR=$TARGET_JAR"
