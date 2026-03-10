#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8080}"
ES_URL="${ES_URL:-http://127.0.0.1:9200}"
QDRANT_URL="${QDRANT_URL:-http://127.0.0.1:6333}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_DB="${MYSQL_DB:-kb}"
MYSQL_USER="${MYSQL_USER:-kb_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-change_me}"
REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
REDIS_PORT="${REDIS_PORT:-6379}"
MINIO_URL="${MINIO_URL:-http://127.0.0.1:9000}"
ES_INDEX="${ES_INDEX:-kb_chunk}"
QDRANT_COLLECTION="${QDRANT_COLLECTION:-kb_chunk}"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

pass() {
  echo "[OK] $1"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "命令不存在：$1"
}

check_http_json() {
  local url="$1"
  local label="$2"
  local body
  body="$(curl -fsSL --max-time 10 "$url")" || fail "$label 请求失败：$url"
  echo "$body" >/dev/null
  pass "$label"
}

check_port() {
  local host="$1"
  local port="$2"
  local label="$3"
  timeout 5 bash -c "</dev/tcp/$host/$port" >/dev/null 2>&1 || fail "$label 端口检查失败：$host:$port"
  pass "$label 端口正常"
}

require_cmd curl
require_cmd mysql
require_cmd python3
require_cmd systemctl
require_cmd timeout

echo "[1/8] 检查 systemd 服务"
systemctl is-active --quiet rag-hub-backend.service || fail "rag-hub-backend.service 未运行"
pass "rag-hub-backend.service 运行正常"
if systemctl list-unit-files | grep -q '^rag-hub-parser-worker.service'; then
  systemctl is-active --quiet rag-hub-parser-worker.service || fail "rag-hub-parser-worker.service 未运行"
  pass "rag-hub-parser-worker.service 运行正常"
fi

if systemctl list-unit-files | grep -q '^nginx.service'; then
  systemctl is-active --quiet nginx.service || fail "nginx.service 未运行"
  pass "nginx.service 运行正常"
fi

echo "[2/8] 检查 TCP 端口"
check_port "$MYSQL_HOST" "$MYSQL_PORT" "MySQL"
check_port "$REDIS_HOST" "$REDIS_PORT" "Redis"
check_port 127.0.0.1 8080 "Backend"
check_port 127.0.0.1 9200 "Elasticsearch"
check_port 127.0.0.1 6333 "Qdrant"
check_port 127.0.0.1 9000 "MinIO"

echo "[3/8] 检查 backend 健康状态"
python3 - <<'PY'
import json, os, urllib.request
backend = os.environ.get('BACKEND_URL', 'http://127.0.0.1:8080')
with urllib.request.urlopen(backend + '/actuator/health', timeout=10) as resp:
    body = json.loads(resp.read().decode('utf-8'))
    assert body.get('status') == 'UP', body
print('[OK] backend actuator health')
PY

echo "[4/8] 检查 MySQL 关键表"
mysql --default-character-set=utf8mb4 -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -D"$MYSQL_DB" -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${MYSQL_DB}' AND table_name IN ('kb_document','kb_document_version','kb_chunk','kb_chunk_vector_ref','kb_ingest_task','kb_query_log');" | {
  read -r table_count
  [[ "$table_count" == "6" ]] || fail "MySQL 关键表不完整"
  pass "MySQL 关键表存在"
}

echo "[5/8] 检查 Elasticsearch"
python3 - <<'PY'
import json, os, urllib.request
es = os.environ.get('ES_URL', 'http://127.0.0.1:9200')
index_name = os.environ.get('ES_INDEX', 'kb_chunk')
with urllib.request.urlopen(es + '/_cluster/health', timeout=10) as resp:
    health = json.loads(resp.read().decode('utf-8'))
    assert health.get('status') in {'green', 'yellow'}, health
with urllib.request.urlopen(es + f'/{index_name}/_count', timeout=10) as resp:
    count = json.loads(resp.read().decode('utf-8'))
    assert 'count' in count, count
print('[OK] elasticsearch health and index count')
PY

echo "[6/8] 检查 Qdrant"
python3 - <<'PY'
import json, os, urllib.request
qdrant = os.environ.get('QDRANT_URL', 'http://127.0.0.1:6333')
collection = os.environ.get('QDRANT_COLLECTION', 'kb_chunk')
with urllib.request.urlopen(qdrant + f'/collections/{collection}', timeout=10) as resp:
    body = json.loads(resp.read().decode('utf-8'))
    assert body.get('status') == 'ok', body
print('[OK] qdrant collection')
PY

echo "[7/8] 检查 MinIO"
check_http_json "$MINIO_URL/minio/health/live" "MinIO 存活检查"

echo "[8/8] 检查搜索接口"
python3 - <<'PY'
import json, os, urllib.request
backend = os.environ.get('BACKEND_URL', 'http://127.0.0.1:8080')
req = urllib.request.Request(
    backend + '/api/search/query',
    data=json.dumps({'query': '审批材料', 'topK': 5}).encode('utf-8'),
    method='POST'
)
req.add_header('Content-Type', 'application/json; charset=utf-8')
with urllib.request.urlopen(req, timeout=15) as resp:
    body = json.loads(resp.read().decode('utf-8'))
    assert body.get('code') == 'KB-00000', body
    assert 'data' in body, body
print('[OK] search api reachable')
PY

echo '部署验收通过。'
