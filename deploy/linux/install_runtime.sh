#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/app/kb}"
DATA_ROOT="${DATA_ROOT:-/data/kb}"
APP_USER="${APP_USER:-kbapp}"
APP_GROUP="${APP_GROUP:-kbapp}"
INSTALL_JAVA="${INSTALL_JAVA:-true}"
INSTALL_PYTHON="${INSTALL_PYTHON:-true}"
INSTALL_MYSQL_CLIENT="${INSTALL_MYSQL_CLIENT:-true}"
INSTALL_NGINX="${INSTALL_NGINX:-false}"

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

detect_pkg_manager() {
  if command -v dnf >/dev/null 2>&1; then
    echo dnf
  elif command -v yum >/dev/null 2>&1; then
    echo yum
  elif command -v apt-get >/dev/null 2>&1; then
    echo apt-get
  else
    echo unknown
  fi
}

detect_os_family() {
  if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    case "${ID_LIKE:-}:${ID:-}" in
      *rhel*:*|*fedora*:*|*:centos|*:rhel|*:rocky|*:almalinux|*:ol)
        echo rhel
        return
        ;;
      *debian*:*|*:debian|*:ubuntu)
        echo debian
        return
        ;;
    esac
  fi
  echo unknown
}

pkg_installed_rpm() {
  rpm -q "$1" >/dev/null 2>&1
}

pkg_installed_dpkg() {
  dpkg -s "$1" >/dev/null 2>&1
}

install_pkg() {
  local pkg="$1"
  local pm="$2"
  local family="$3"

  if [[ "$family" == "rhel" ]] && pkg_installed_rpm "$pkg"; then
    pass "软件包已安装：$pkg"
    return
  fi

  if [[ "$family" == "debian" ]] && pkg_installed_dpkg "$pkg"; then
    pass "软件包已安装：$pkg"
    return
  fi

  case "$pm" in
    dnf)
      dnf install -y "$pkg"
      ;;
    yum)
      yum install -y "$pkg"
      ;;
    apt-get)
      DEBIAN_FRONTEND=noninteractive apt-get install -y "$pkg"
      ;;
    *)
      fail "不支持的包管理器：$pm"
      ;;
  esac
  pass "软件包安装完成：$pkg"
}

prepare_pkg_manager() {
  local pm="$1"
  case "$pm" in
    apt-get)
      apt-get update -y
      ;;
  esac
}

pkg_name() {
  local logical="$1"
  local family="$2"
  case "$logical:$family" in
    mysql-client:rhel)
      echo mysql
      ;;
    mysql-client:debian)
      echo default-mysql-client
      ;;
    python3-pip:rhel)
      echo python3-pip
      ;;
    python3-pip:debian)
      echo python3-pip
      ;;
    java17:rhel)
      echo java-17-openjdk
      ;;
    java17:debian)
      echo openjdk-17-jre-headless
      ;;
    net-tools:rhel)
      echo net-tools
      ;;
    net-tools:debian)
      echo net-tools
      ;;
    which:rhel)
      echo which
      ;;
    which:debian)
      echo debianutils
      ;;
    *)
      echo "$logical"
      ;;
  esac
}

ensure_user_group() {
  getent group "$APP_GROUP" >/dev/null 2>&1 || groupadd "$APP_GROUP"
  id "$APP_USER" >/dev/null 2>&1 || useradd -g "$APP_GROUP" -m -s /bin/bash "$APP_USER"
  pass "用户和用户组已就绪：$APP_USER:$APP_GROUP"
}

ensure_dir() {
  local path="$1"
  mkdir -p "$path"
  chown -R "$APP_USER:$APP_GROUP" "$path"
}

require_root
PM="$(detect_pkg_manager)"
FAMILY="$(detect_os_family)"
[[ "$PM" != "unknown" ]] || fail "未检测到支持的包管理器"
[[ "$FAMILY" != "unknown" ]] || fail "不支持的 Linux 发行版"

prepare_pkg_manager "$PM"

echo "[1/6] 安装基础软件包"
for logical in curl wget unzip tar which net-tools lsof git; do
  install_pkg "$(pkg_name "$logical" "$FAMILY")" "$PM" "$FAMILY"
done

if [[ "$INSTALL_JAVA" == "true" ]]; then
  echo "[2/6] 安装 Java 17 运行时"
  install_pkg "$(pkg_name java17 "$FAMILY")" "$PM" "$FAMILY"
fi

if [[ "$INSTALL_PYTHON" == "true" ]]; then
  echo "[3/6] 安装 Python 运行时"
  install_pkg python3 "$PM" "$FAMILY"
  install_pkg "$(pkg_name python3-pip "$FAMILY")" "$PM" "$FAMILY"
fi

if [[ "$INSTALL_MYSQL_CLIENT" == "true" ]]; then
  echo "[4/6] 安装 MySQL 客户端"
  install_pkg "$(pkg_name mysql-client "$FAMILY")" "$PM" "$FAMILY"
fi

if [[ "$INSTALL_NGINX" == "true" ]]; then
  echo "[5/6] 安装 Nginx"
  install_pkg nginx "$PM" "$FAMILY"
else
  echo "[5/6] 跳过 Nginx 安装"
fi

echo "[6/6] 准备用户和目录"
ensure_user_group
for path in \
  "$APP_ROOT" \
  "$APP_ROOT/backend" \
  "$APP_ROOT/parser-worker" \
  "$APP_ROOT/config" \
  "$APP_ROOT/logs" \
  "$APP_ROOT/run" \
  "$APP_ROOT/scripts" \
  "$APP_ROOT/packages" \
  "$APP_ROOT/deploy" \
  "$APP_ROOT/backups" \
  "$DATA_ROOT" \
  "$DATA_ROOT/mysql" \
  "$DATA_ROOT/elasticsearch" \
  "$DATA_ROOT/qdrant" \
  "$DATA_ROOT/minio" \
  "$DATA_ROOT/uploads"; do
  ensure_dir "$path"
done

cat <<EOF
运行时安装完成。

OS_FAMILY=$FAMILY
PACKAGE_MANAGER=$PM
APP_ROOT=$APP_ROOT
DATA_ROOT=$DATA_ROOT
APP_USER=$APP_USER
APP_GROUP=$APP_GROUP
EOF
