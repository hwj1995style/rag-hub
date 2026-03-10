#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/app/kb}"
APP_USER="${APP_USER:-kbapp}"
APP_GROUP="${APP_GROUP:-kbapp}"
JAR_SOURCE="${JAR_SOURCE:-$APP_ROOT/packages/rag-hub-backend.jar}"
TARGET_JAR="${TARGET_JAR:-$APP_ROOT/backend/rag-hub-backend.jar}"
ENV_FILE="${ENV_FILE:-$APP_ROOT/config/kb.env}"
SERVICE_FILE_SOURCE="${SERVICE_FILE_SOURCE:-$APP_ROOT/deploy/linux/systemd/rag-hub-backend.service}"
SERVICE_FILE_TARGET="${SERVICE_FILE_TARGET:-/etc/systemd/system/rag-hub-backend.service}"
SERVICE_NAME="${SERVICE_NAME:-rag-hub-backend.service}"
BACKUP_ROOT="${BACKUP_ROOT:-$APP_ROOT/backups/backend}"
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
    fail "请使用 root 用户执行"
  fi
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || fail "文件不存在：$path"
}

require_root
require_file "$JAR_SOURCE"
require_file "$SERVICE_FILE_SOURCE"
require_file "$ENV_FILE"

mkdir -p "$BACKUP_DIR"
if [[ -f "$TARGET_JAR" ]]; then
  cp "$TARGET_JAR" "$BACKUP_DIR/rag-hub-backend.jar"
  pass "已备份当前 backend 包"
fi

mkdir -p "$(dirname "$TARGET_JAR")"
cp "$JAR_SOURCE" "$TARGET_JAR"
chown "$APP_USER:$APP_GROUP" "$TARGET_JAR"
chmod 0644 "$TARGET_JAR"
pass "backend 包发布完成"

cp "$SERVICE_FILE_SOURCE" "$SERVICE_FILE_TARGET"
chmod 0644 "$SERVICE_FILE_TARGET"
pass "systemd 服务文件已部署"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl is-active --quiet "$SERVICE_NAME" || fail "$SERVICE_NAME 启动失败"
pass "$SERVICE_NAME 运行正常"

echo "Backend 发布完成。"
echo "BACKUP_DIR=$BACKUP_DIR"
echo "JAR_SOURCE=$JAR_SOURCE"
echo "TARGET_JAR=$TARGET_JAR"
echo "ENV_FILE=$ENV_FILE"
