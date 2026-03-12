param(
    [string]$BackendEndpoint = "http://127.0.0.1:8080",
    [string]$MySqlContainer = "kb-mysql",
    [string]$Database = "kb",
    [string]$User = "kb_user",
    [string]$Password = "change_me",
    [string]$QaQuery = "客户额度审批需要哪些材料？"
)

$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"
$env:API_ASSERT_BACKEND = $BackendEndpoint
$env:API_ASSERT_QA_QUERY = $QaQuery
$env:API_ASSERT_SESSION_ID = "api-assert-session"
$dockerExe = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

if (-not (Test-Path $dockerExe)) {
    throw "docker.exe not found: $dockerExe"
}

Write-Host "[1/3] Invoke QA query..."
$qaPy = @"
import os
import json
from urllib.request import Request, urlopen
backend = os.environ["API_ASSERT_BACKEND"]
qa_query = os.environ["API_ASSERT_QA_QUERY"]
session_id = os.environ["API_ASSERT_SESSION_ID"]
req = Request(backend + "/api/qa/query", data=json.dumps({"query": qa_query, "sessionId": session_id}).encode("utf-8"), method="POST")
req.add_header("Content-Type", "application/json; charset=utf-8")
with urlopen(req, timeout=15) as resp:
    body = json.loads(resp.read().decode("utf-8"))
    print(json.dumps(body, ensure_ascii=False, indent=2))
    data = body.get("data", {})
    assert body.get("code") == "KB-00000", body
    assert data.get("sessionId") == session_id, data
    assert isinstance(data.get("answer"), str) and data.get("answer"), data
    assert isinstance(data.get("citations"), list) and len(data.get("citations")) >= 1, data
    assert (data.get("retrievedCount") or 0) >= 1, data
"@
$qaPy | python -

Write-Host "[2/3] Resolve latest query log id..."
$sql = "SELECT id FROM kb_query_log WHERE session_id = 'api-assert-session' AND query_text = '" + $QaQuery + "' ORDER BY created_at DESC, id DESC LIMIT 1;"
$latestLogId = (& $dockerExe exec $MySqlContainer mysql "--default-character-set=utf8mb4" ("-u" + $User) ("-p" + $Password) "-N" "-B" "-D" $Database "-e" $sql).Trim()
if (-not $latestLogId) {
    throw "No matching query log found after QA invocation"
}
Write-Host "latest_log_id=$latestLogId"

Write-Host "[3/3] Validate query log payload..."
$env:API_ASSERT_LOG_ID = $latestLogId
$logPy = @"
import os
import json
from urllib.request import urlopen
backend = os.environ["API_ASSERT_BACKEND"]
log_id = os.environ["API_ASSERT_LOG_ID"]
qa_query = os.environ["API_ASSERT_QA_QUERY"]
with urlopen(backend + "/api/query-logs/" + log_id, timeout=15) as resp:
    body = json.loads(resp.read().decode("utf-8"))
    print(json.dumps(body, ensure_ascii=False, indent=2))
    data = body.get("data", {})
    assert body.get("code") == "KB-00000", body
    assert data.get("query_text") == qa_query, data
    assert isinstance(data.get("answer_text"), str) and data.get("answer_text"), data
    assert isinstance(data.get("retrieved_chunk_ids"), list) and len(data.get("retrieved_chunk_ids")) >= 1, data
    assert isinstance(data.get("citations"), list) and len(data.get("citations")) >= 1, data
"@
$logPy | python -
