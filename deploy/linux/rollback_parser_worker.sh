#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/app/kb}"
APP_USER="${APP_USER:-kbapp}"
APP_GROUP="${APP_GROUP:-kbapp}"
TARGET_DIR="${TARGET_DIR:-$APP_ROOT/parser-worker}"
BACKUP_ROOT="${BACKUP_ROOT:-$APP_ROOT/backups/parser-worker}"
SERVICE_NAME="${SERVICE_NAME:-rag-hub-parser-worker.service}"
ROLLBACK_SOURCE="${ROLLBACK_SOURCE:-}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
VENV_DIR="${VENV_DIR:-$TARGET_DIR/.venv}"

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

require_dir() {
  local path="$1"
  [[ -d "$path" ]] || fail "目录不存在：$path"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "命令不存在：$1"
}

latest_backup() {
  find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d | sort | tail -n 1
}

require_root
require_cmd rsync
require_cmd "$PYTHON_BIN"

if [[ -z "$ROLLBACK_SOURCE" ]]; then
  ROLLBACK_SOURCE="$(latest_backup)"
fi

require_dir "$ROLLBACK_SOURCE"
mkdir -p "$TARGET_DIR"
rsync -a --delete "$ROLLBACK_SOURCE"/ "$TARGET_DIR"/
chown -R "$APP_USER:$APP_GROUP" "$TARGET_DIR"
pass "parser-worker 文件已回滚"

if [[ -f "$TARGET_DIR/requirements.txt" ]]; then
  "$PYTHON_BIN" -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install --upgrade pip
  "$VENV_DIR/bin/pip" install -r "$TARGET_DIR/requirements.txt"
  chown -R "$APP_USER:$APP_GROUP" "$VENV_DIR"
  pass "parser-worker 虚拟环境已刷新"
fi

systemctl restart "$SERVICE_NAME"
systemctl is-active --quiet "$SERVICE_NAME" || fail "$SERVICE_NAME 回滚后启动失败"
pass "$SERVICE_NAME 运行正常"

echo "Parser-worker 回滚完成。"
echo "ROLLBACK_SOURCE=$ROLLBACK_SOURCE"
echo "TARGET_DIR=$TARGET_DIR"
