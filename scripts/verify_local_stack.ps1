param(
    [string]$BackendEndpoint = 'http://127.0.0.1:8080',
    [string]$FrontendEndpoint = 'http://127.0.0.1:5173',
    [string]$DocumentId = '11111111-1111-1111-1111-111111111111',
    [string]$HistoryVersionId = '22222222-2222-2222-2222-222222222223',
    [string]$SampleTaskId = '44444444-4444-4444-4444-444444444444',
    [string]$SampleLogId = '66666666-6666-6666-6666-666666666666'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.runtime\frontend-integration'
$sampleFile = Join-Path $runtimeDir 'upload-sample.txt'
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
Set-Content -Path $sampleFile -Value 'rag-hub frontend integration upload sample' -Encoding utf8

try {
    $backendHealth = Invoke-RestMethod -Uri "$BackendEndpoint/actuator/health" -TimeoutSec 5
    Write-Host "[OK] backend health: $($backendHealth.status)"
}
catch {
    throw "Backend health check failed: $BackendEndpoint/actuator/health"
}

$frontendStatus = curl.exe -s -o NUL -w "%{http_code}" "$FrontendEndpoint/"
if ($frontendStatus -ne '200') {
    throw "Frontend endpoint check failed: $FrontendEndpoint (status=$frontendStatus)"
}
Write-Host "[OK] frontend endpoint: $frontendStatus"

$py = @"
import json
import mimetypes
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

frontend = '__FRONTEND__'
document_id = '__DOCUMENT_ID__'
history_version_id = '__HISTORY_VERSION_ID__'
sample_task_id = '__SAMPLE_TASK_ID__'
sample_log_id = '__SAMPLE_LOG_ID__'
sample_file = Path(r'__SAMPLE_FILE__')


def load_response(resp):
    return json.loads(resp.read().decode('utf-8'))


def call_json(path, method='GET', payload=None, token=None, allow_error=False):
    data = None if payload is None else json.dumps(payload).encode('utf-8')
    req = Request(frontend + path, data=data, method=method)
    req.add_header('Accept', 'application/json')
    if data is not None:
        req.add_header('Content-Type', 'application/json; charset=utf-8')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urlopen(req, timeout=20) as resp:
            return load_response(resp)
    except HTTPError as exc:
        body = exc.read().decode('utf-8', errors='replace')
        if allow_error:
            return json.loads(body)
        raise RuntimeError(f'{method} {path} failed: {exc.code} {body}') from exc


def call_upload(path, file_path, fields, token):
    boundary = '----raghub-' + uuid.uuid4().hex
    body = []
    for key, value in fields.items():
        body.append(f'--{boundary}\r\n'.encode('utf-8'))
        body.append(f'Content-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode('utf-8'))
    mime_type = mimetypes.guess_type(file_path.name)[0] or 'application/octet-stream'
    body.append(f'--{boundary}\r\n'.encode('utf-8'))
    body.append(
        (
            f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'
            f'Content-Type: {mime_type}\r\n\r\n'
        ).encode('utf-8')
    )
    body.append(file_path.read_bytes())
    body.append(b'\r\n')
    body.append(f'--{boundary}--\r\n'.encode('utf-8'))
    payload = b''.join(body)

    req = Request(frontend + path, data=payload, method='POST')
    req.add_header('Accept', 'application/json')
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    try:
        with urlopen(req, timeout=30) as resp:
            return load_response(resp)
    except HTTPError as exc:
        body = exc.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'POST {path} failed: {exc.code} {body}') from exc


login = call_json('/api/auth/login', 'POST', {'username': 'tester', 'password': 'test123456'})
viewer = call_json('/api/auth/login', 'POST', {'username': 'viewer', 'password': 'viewer123'})
admin_token = login['data']['accessToken']
viewer_token = viewer['data']['accessToken']

documents = call_json('/api/documents?page_no=1&page_size=20', token=admin_token)
task_detail = call_json(f'/api/tasks/{sample_task_id}', token=admin_token)
query_log = call_json(f'/api/query-logs/{sample_log_id}', token=admin_token)
upload = call_upload(
    '/api/documents/upload',
    sample_file,
    {
        'title': 'Frontend Integration Upload',
        'biz_domain': 'credit',
        'department': 'CreditReview',
        'security_level': 'internal',
        'source_system': 'frontend-integration',
        'owner': 'tester',
        'permission_tags': 'internal,credit',
    },
    admin_token,
)
reparse = call_json(
    f'/api/documents/{document_id}/reparse',
    'POST',
    {'forceReindex': True, 'reason': 'frontend integration verification'},
    admin_token,
)
activate = call_json(
    f'/api/documents/{document_id}/versions/{history_version_id}/activate',
    'POST',
    {'effectiveFrom': '2026-03-11T10:00:00+08:00', 'remark': 'frontend integration verification'},
    admin_token,
)
viewer_forbidden = call_json(
    f'/api/documents/{document_id}/reparse',
    'POST',
    {'forceReindex': False, 'reason': 'viewer should fail'},
    viewer_token,
    allow_error=True,
)

summary = {
    'loginCode': login['code'],
    'viewerLoginCode': viewer['code'],
    'docsTotal': documents['data']['total'],
    'taskStatus': task_detail['data']['status'],
    'queryLogId': query_log['data']['log_id'],
    'uploadTaskId': upload['data']['task_id'],
    'reparseTaskId': reparse['data']['taskId'],
    'activateVersionId': activate['data']['version_id'],
    'viewerForbiddenCode': viewer_forbidden['code'],
}
print(json.dumps(summary, ensure_ascii=False, indent=2))
"@

$py = $py.Replace('__FRONTEND__', $FrontendEndpoint)
$py = $py.Replace('__DOCUMENT_ID__', $DocumentId)
$py = $py.Replace('__HISTORY_VERSION_ID__', $HistoryVersionId)
$py = $py.Replace('__SAMPLE_TASK_ID__', $SampleTaskId)
$py = $py.Replace('__SAMPLE_LOG_ID__', $SampleLogId)
$py = $py.Replace('__SAMPLE_FILE__', $sampleFile)
$py | python -
