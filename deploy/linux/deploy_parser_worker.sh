#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/app/kb}"
APP_USER="${APP_USER:-kbapp}"
APP_GROUP="${APP_GROUP:-kbapp}"
PACKAGE_SOURCE="${PACKAGE_SOURCE:-$APP_ROOT/packages/parser-worker.zip}"
TARGET_DIR="${TARGET_DIR:-$APP_ROOT/parser-worker}"
ENV_FILE="${ENV_FILE:-$APP_ROOT/config/kb.env}"
SERVICE_FILE_SOURCE="${SERVICE_FILE_SOURCE:-$APP_ROOT/deploy/systemd/rag-hub-parser-worker.service}"
SERVICE_FILE_TARGET="${SERVICE_FILE_TARGET:-/etc/systemd/system/rag-hub-parser-worker.service}"
SERVICE_NAME="${SERVICE_NAME:-rag-hub-parser-worker.service}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
VENV_DIR="${VENV_DIR:-$TARGET_DIR/.venv}"
BACKUP_ROOT="${BACKUP_ROOT:-$APP_ROOT/backups/parser-worker}"
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

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "命令不存在：$1"
}

require_root
require_cmd unzip
require_cmd rsync
require_cmd "$PYTHON_BIN"
require_file "$PACKAGE_SOURCE"
require_file "$SERVICE_FILE_SOURCE"
require_file "$ENV_FILE"

mkdir -p "$BACKUP_DIR"
if [[ -d "$TARGET_DIR" ]]; then
  rsync -a "$TARGET_DIR"/ "$BACKUP_DIR"/
  pass "已备份当前 parser-worker 目录"
fi

mkdir -p "$TARGET_DIR"
rm -rf "$TARGET_DIR"/*
unzip -oq "$PACKAGE_SOURCE" -d "$TARGET_DIR"
chown -R "$APP_USER:$APP_GROUP" "$TARGET_DIR"
pass "parser-worker 包发布完成"

"$PYTHON_BIN" -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install --upgrade pip
"$VENV_DIR/bin/pip" install -r "$TARGET_DIR/requirements.txt"
chown -R "$APP_USER:$APP_GROUP" "$VENV_DIR"
pass "parser-worker 虚拟环境已就绪"

cp "$SERVICE_FILE_SOURCE" "$SERVICE_FILE_TARGET"
chmod 0644 "$SERVICE_FILE_TARGET"
pass "systemd 服务文件已部署"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
systemctl is-active --quiet "$SERVICE_NAME" || fail "$SERVICE_NAME 启动失败"
pass "$SERVICE_NAME 运行正常"

echo "Parser-worker 发布完成。"
echo "BACKUP_DIR=$BACKUP_DIR"
echo "PACKAGE_SOURCE=$PACKAGE_SOURCE"
echo "TARGET_DIR=$TARGET_DIR"
echo "VENV_DIR=$VENV_DIR"
