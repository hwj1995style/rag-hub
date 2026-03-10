param(
    [string]$BackendEndpoint = "http://127.0.0.1:8080",
    [string]$DocumentId = "11111111-1111-1111-1111-111111111111",
    [string]$TaskId = "44444444-4444-4444-4444-444444444444",
    [string]$SearchQuery = "审批材料",
    [string]$QaQuery = "客户额度审批需要哪些材料？"
)

$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"

$py = @"
import json
from urllib.request import Request, urlopen

backend = "__BACKEND__"
document_id = "__DOCUMENT_ID__"
task_id = "__TASK_ID__"
search_query = "__SEARCH_QUERY__"
qa_query = "__QA_QUERY__"

def call(url, method="GET", payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = Request(url, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json; charset=utf-8")
    with urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))

checks = [
    ("documents", call(f"{backend}/api/documents?page=0&size=10")),
    ("document_detail", call(f"{backend}/api/documents/{document_id}")),
    ("document_chunks", call(f"{backend}/api/documents/{document_id}/chunks")),
    ("task_detail", call(f"{backend}/api/tasks/{task_id}")),
    ("search", call(f"{backend}/api/search/query", "POST", {"query": search_query, "topK": 5})),
    ("qa", call(f"{backend}/api/qa/query", "POST", {"query": qa_query, "sessionId": "api-smoke-session"})),
]

for name, body in checks:
    print(f"===== {name} =====")
    print(json.dumps(body, ensure_ascii=False, indent=2))
"@

$py = $py.Replace('__BACKEND__', $BackendEndpoint).Replace('__DOCUMENT_ID__', $DocumentId).Replace('__TASK_ID__', $TaskId).Replace('__SEARCH_QUERY__', $SearchQuery).Replace('__QA_QUERY__', $QaQuery)
$py | python -

