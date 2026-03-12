#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1}"
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
  command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"
}

check_http_json() {
  local url="$1"
  local label="$2"
  local body
  body="$(curl -fsSL --max-time 10 "$url")" || fail "$label failed: $url"
  echo "$body" >/dev/null
  pass "$label"
}

check_port() {
  local host="$1"
  local port="$2"
  local label="$3"
  timeout 5 bash -c "</dev/tcp/$host/$port" >/dev/null 2>&1 || fail "$label port check failed: $host:$port"
  pass "$label port ok"
}

require_cmd curl
require_cmd mysql
require_cmd python3
require_cmd systemctl
require_cmd timeout

echo "[1/9] check systemd services"
systemctl is-active --quiet rag-hub-backend.service || fail "rag-hub-backend.service is not running"
pass "rag-hub-backend.service is active"
if systemctl list-unit-files | grep -q '^rag-hub-parser-worker.service'; then
  systemctl is-active --quiet rag-hub-parser-worker.service || fail "rag-hub-parser-worker.service is not running"
  pass "rag-hub-parser-worker.service is active"
fi
if systemctl list-unit-files | grep -q '^nginx.service'; then
  systemctl is-active --quiet nginx.service || fail "nginx.service is not running"
  pass "nginx.service is active"
fi

echo "[2/9] check tcp ports"
check_port "$MYSQL_HOST" "$MYSQL_PORT" "MySQL"
check_port "$REDIS_HOST" "$REDIS_PORT" "Redis"
check_port 127.0.0.1 8080 "Backend"
check_port 127.0.0.1 9200 "Elasticsearch"
check_port 127.0.0.1 6333 "Qdrant"
check_port 127.0.0.1 9000 "MinIO"
check_port 127.0.0.1 80 "Nginx"

echo "[3/9] check backend health"
python3 - <<'PY'
import json, os, urllib.request
backend = os.environ.get('BACKEND_URL', 'http://127.0.0.1:8080')
with urllib.request.urlopen(backend + '/actuator/health', timeout=10) as resp:
    body = json.loads(resp.read().decode('utf-8'))
    assert body.get('status') == 'UP', body
print('[OK] backend actuator health')
PY

echo "[4/9] check frontend entry"
python3 - <<'PY'
import os, urllib.request
frontend = os.environ.get('FRONTEND_URL', 'http://127.0.0.1')
with urllib.request.urlopen(frontend + '/', timeout=10) as resp:
    body = resp.read().decode('utf-8')
    assert resp.status == 200, resp.status
    assert 'rag-hub' in body.lower(), body[:200]
print('[OK] frontend entry')
PY

echo "[5/9] check MySQL tables"
mysql --default-character-set=utf8mb4 -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -D"$MYSQL_DB" -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${MYSQL_DB}' AND table_name IN ('kb_document','kb_document_version','kb_chunk','kb_chunk_vector_ref','kb_ingest_task','kb_query_log');" | {
  read -r table_count
  [[ "$table_count" == "6" ]] || fail "MySQL key tables are incomplete"
  pass "MySQL key tables exist"
}

echo "[6/9] check Elasticsearch"
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

echo "[7/9] check Qdrant"
python3 - <<'PY'
import json, os, urllib.request
qdrant = os.environ.get('QDRANT_URL', 'http://127.0.0.1:6333')
collection = os.environ.get('QDRANT_COLLECTION', 'kb_chunk')
with urllib.request.urlopen(qdrant + f'/collections/{collection}', timeout=10) as resp:
    body = json.loads(resp.read().decode('utf-8'))
    assert body.get('status') == 'ok', body
print('[OK] qdrant collection')
PY

echo "[8/9] check MinIO"
check_http_json "$MINIO_URL/minio/health/live" "MinIO live check"

echo "[9/9] check search api"
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

echo 'deployment verification passed.'
