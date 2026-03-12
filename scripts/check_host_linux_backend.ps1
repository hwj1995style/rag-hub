param(
    [Parameter(Mandatory = $true)]
    [string]$BackendEndpoint,
    [string]$Username = 'admin',
    [string]$Password = 'ChangeMe123!'
)

$ErrorActionPreference = 'Stop'

function Invoke-JsonPost {
    param(
        [string]$Uri,
        [object]$Body,
        [hashtable]$Headers = @{}
    )

    $payload = $Body | ConvertTo-Json -Depth 6
    return Invoke-RestMethod -Method Post -Uri $Uri -Headers $Headers -ContentType 'application/json; charset=utf-8' -Body $payload
}

$baseUrl = $BackendEndpoint.TrimEnd('/')

Write-Host "[1/4] Checking actuator health: $baseUrl/actuator/health"
$health = Invoke-RestMethod -Method Get -Uri "$baseUrl/actuator/health"
if ($health.status -ne 'UP') {
    throw "Backend health is not UP: $($health | ConvertTo-Json -Depth 4)"
}
Write-Host '[OK] actuator health is UP'

Write-Host "[2/4] Checking login: $baseUrl/api/auth/login"
$loginResponse = Invoke-JsonPost -Uri "$baseUrl/api/auth/login" -Body @{
    username = $Username
    password = $Password
}
if ($loginResponse.code -ne 'KB-00000') {
    throw "Login failed: $($loginResponse | ConvertTo-Json -Depth 6)"
}
$token = $loginResponse.data.accessToken
if (-not $token) {
    throw 'Login succeeded but accessToken is empty.'
}
Write-Host '[OK] login succeeded'

$authHeaders = @{
    Authorization = "Bearer $token"
}

Write-Host "[3/4] Checking document list: $baseUrl/api/documents"
$documents = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/documents?pageNo=1&pageSize=5" -Headers $authHeaders
if ($documents.code -ne 'KB-00000') {
    throw "Document list failed: $($documents | ConvertTo-Json -Depth 6)"
}
Write-Host "[OK] documents reachable, total=$($documents.data.total)"

Write-Host "[4/4] Checking search API: $baseUrl/api/search/query"
$search = Invoke-JsonPost -Uri "$baseUrl/api/search/query" -Headers $authHeaders -Body @{
    query = '审批材料'
    topK = 5
}
if ($search.code -ne 'KB-00000') {
    throw "Search failed: $($search | ConvertTo-Json -Depth 6)"
}
Write-Host "[OK] search reachable, items=$($search.data.items.Count)"
Write-Host 'Host Linux backend preflight passed.'