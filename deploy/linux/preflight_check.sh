#!/usr/bin/env bash
set -euo pipefail

pass() {
  echo "[OK] $1"
}

warn() {
  echo "[WARN] $1"
}

info() {
  echo "[INFO] $1"
}

detect_os() {
  if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    echo "ID=${ID:-unknown}"
    echo "VERSION_ID=${VERSION_ID:-unknown}"
    echo "ID_LIKE=${ID_LIKE:-unknown}"
    return
  fi
  echo "ID=unknown"
  echo "VERSION_ID=unknown"
  echo "ID_LIKE=unknown"
}

detect_pkg_manager() {
  if command -v dnf >/dev/null 2>&1; then
    echo dnf
  elif command -v yum >/dev/null 2>&1; then
    echo yum
  elif command -v apt-get >/dev/null 2>&1; then
    echo apt-get
  else
    echo none
  fi
}

recommend_mode() {
  if command -v docker >/dev/null 2>&1; then
    echo docker_or_host
  else
    echo host_only
  fi
}

echo '[1/6] 检测操作系统'
detect_os

echo '[2/6] 检测包管理器'
PM="$(detect_pkg_manager)"
if [[ "$PM" == "none" ]]; then
  warn '未检测到受支持的包管理器'
else
  pass "包管理器：$PM"
fi

echo '[3/6] 检测运行时命令'
for cmd in systemctl nginx java python3 mysql docker; do
  if command -v "$cmd" >/dev/null 2>&1; then
    pass "$cmd 已安装"
  else
    warn "$cmd 未找到"
  fi
done

echo '[4/6] 检测 Docker 可用性'
if command -v docker >/dev/null 2>&1; then
  if docker version >/dev/null 2>&1; then
    pass 'docker daemon 可连接'
  else
    warn 'docker 已安装，但 daemon 不可连接'
  fi
fi

echo '[5/6] 推荐部署方式'
MODE="$(recommend_mode)"
case "$MODE" in
  docker_or_host)
    info '当前环境可选择 Host Linux 部署或 Docker 部署'
    ;;
  host_only)
    info '当前环境建议使用 Host Linux 部署'
    ;;
esac

echo '[6/6] 下一步建议'
if [[ "$MODE" == 'docker_or_host' ]]; then
  echo 'Host Linux 运行时安装：deploy/linux/install_runtime.sh'
  echo 'Host Linux 部署文档：docs/knowledge-base-deployment-host-linux.md'
  echo 'Docker 部署文档：docs/knowledge-base-deployment-docker.md'
else
  echo '请先执行 Host Linux 运行时安装：deploy/linux/install_runtime.sh'
  echo '然后参考 Host Linux 部署文档继续配置 systemd 和 nginx'
fi
