param(
    [string]$MySqlContainer = "kb-mysql",
    [string]$Database = "kb",
    [string]$User = "kb_user",
    [string]$Password = "change_me",
    [string]$ElasticEndpoint = "http://127.0.0.1:9200",
    [string]$QdrantEndpoint = "http://127.0.0.1:6333",
    [string]$BackendEndpoint = "http://127.0.0.1:8080",
    [string]$SearchQuery = "审批材料",
    [string]$QaQuery = "客户额度审批需要哪些材料？"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$dockerExe = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
$searchInitScript = Join-Path $repoRoot "scripts\init_search_stack.ps1"
$workerDir = Join-Path $repoRoot "parser-worker"
$documentId = "11111111-1111-1111-1111-111111111111"
$taskId = "44444444-4444-4444-4444-444444444444"

if (-not (Test-Path $dockerExe)) {
    throw "docker.exe not found: $dockerExe"
}

Write-Host "[1/6] Reset MySQL sample data and task state..."
& $dockerExe exec $MySqlContainer mysql "--default-character-set=utf8mb4" ("-u" + $User) ("-p" + $Password) "-D" $Database "-e" @"
DELETE FROM kb_query_log;
DELETE FROM kb_permission_policy;
DELETE FROM kb_chunk_vector_ref;
DELETE FROM kb_chunk;
DELETE FROM kb_ingest_task;
DELETE FROM kb_document_version;
DELETE FROM kb_document;
DELETE FROM kb_admin_user;
SOURCE /docker-entrypoint-initdb.d/060_seed_test_data.sql;
UPDATE kb_document_version
SET parse_status='pending', index_status='pending', remark=NULL
WHERE id='22222222-2222-2222-2222-222222222222';
UPDATE kb_ingest_task
SET status='pending', step='queued', error_message=NULL, started_at=NULL, finished_at=NULL
WHERE id='44444444-4444-4444-4444-444444444444';
"@

Write-Host "[2/6] Recreate Elasticsearch/Qdrant search resources..."
try { Invoke-RestMethod -Uri "$ElasticEndpoint/kb_chunk" -Method Delete -TimeoutSec 10 | Out-Null } catch {}
try { Invoke-RestMethod -Uri "$QdrantEndpoint/collections/kb_chunk" -Method Delete -TimeoutSec 10 | Out-Null } catch {}
& $searchInitScript | Out-Host

Write-Host "[3/6] Run parser-worker once..."
Push-Location $workerDir
try {
    python -c "from parser_worker.config import load_config; from parser_worker.db import Database; from parser_worker.processor import TaskProcessor; from parser_worker.storage.client import StorageClient; config = load_config('config.yml'); db = Database(config.database); storage = StorageClient(config.storage); processor = TaskProcessor(db, storage, config); print(processor.run_once())"
}
finally {
    Pop-Location
}

Write-Host "[4/6] Validate task and index status..."
& $dockerExe exec $MySqlContainer mysql "--default-character-set=utf8mb4" ("-u" + $User) ("-p" + $Password) "-D" $Database "-e" @"
SELECT id,status,step,error_message FROM kb_ingest_task;
SELECT id,parse_status,index_status,remark FROM kb_document_version;
SELECT COUNT(*) AS chunk_count FROM kb_chunk;
SELECT COUNT(*) AS vector_ref_count FROM kb_chunk_vector_ref;
"@
try {
    Invoke-RestMethod -Uri "$ElasticEndpoint/kb_chunk/_count" -TimeoutSec 10 | ConvertTo-Json -Depth 5 | Out-Host
}
catch {
    $_ | Out-String | Out-Host
}
Invoke-RestMethod -Uri "$QdrantEndpoint/collections/kb_chunk" -TimeoutSec 10 | ConvertTo-Json -Depth 8 | Out-Host

Write-Host "[5/6] Smoke test backend APIs..."
$env:PYTHONIOENCODING = "utf-8"
$py = @"
import json
from urllib.request import Request, urlopen
backend = "__BACKEND__"
document_id = "__DOCUMENT_ID__"
task_id = "__TASK_ID__"
qa_query = "__QA_QUERY__"
search_query = "__SEARCH_QUERY__"

def call(url, method="GET", payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = Request(url, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json; charset=utf-8")
    with urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))

print(json.dumps(call(f"{backend}/api/documents?page=0&size=10"), ensure_ascii=False, indent=2))
print(json.dumps(call(f"{backend}/api/documents/{document_id}"), ensure_ascii=False, indent=2))
print(json.dumps(call(f"{backend}/api/documents/{document_id}/chunks"), ensure_ascii=False, indent=2))
print(json.dumps(call(f"{backend}/api/tasks/{task_id}"), ensure_ascii=False, indent=2))
print(json.dumps(call(f"{backend}/api/search/query", "POST", {"query": search_query, "topK": 5}), ensure_ascii=False, indent=2))
qa_resp = call(f"{backend}/api/qa/query", "POST", {"query": qa_query, "sessionId": "reindex-smoke-session"})
print(json.dumps(qa_resp, ensure_ascii=False, indent=2))
"@
$py = $py.Replace('__BACKEND__', $BackendEndpoint).Replace('__DOCUMENT_ID__', $documentId).Replace('__TASK_ID__', $taskId).Replace('__QA_QUERY__', $QaQuery).Replace('__SEARCH_QUERY__', $SearchQuery)
$py | python -

Write-Host "[6/6] Validate latest query log..."
$latestLogId = (& $dockerExe exec $MySqlContainer mysql "--default-character-set=utf8mb4" ("-u" + $User) ("-p" + $Password) "-N" "-B" "-D" $Database "-e" "SELECT id FROM kb_query_log ORDER BY created_at DESC LIMIT 1;").Trim()
if ($latestLogId) {
    $pyLog = @"
import json
from urllib.request import urlopen
with urlopen("__BACKEND__/api/query-logs/__LOG_ID__", timeout=15) as resp:
    print(json.dumps(json.loads(resp.read().decode("utf-8")), ensure_ascii=False, indent=2))
"@
    $pyLog = $pyLog.Replace('__BACKEND__', $BackendEndpoint).Replace('__LOG_ID__', $latestLogId)
    $pyLog | python -
} else {
    Write-Host "No query log found."
}

