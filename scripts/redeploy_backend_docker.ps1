param(
    [string]$EnvFile = 'deploy/docker/.env.example',
    [switch]$CleanPackage,
    [switch]$RunTests,
    [switch]$StartFullStack
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$envFilePath = Join-Path $repoRoot $EnvFile
if (-not (Test-Path $envFilePath)) {
    throw "Docker env file not found: $envFilePath"
}

Write-Host '[backend] packaging jar'
$packageCommand = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $PSScriptRoot 'package_backend.ps1')
)
if ($CleanPackage) {
    $packageCommand += '-Clean'
}
if (-not $RunTests) {
    $packageCommand += '-SkipTests'
}
& powershell @packageCommand
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$services = @('mysql', 'redis', 'minio', 'elasticsearch', 'qdrant', 'rag-hub-backend')
if ($StartFullStack) {
    $services += 'rag-hub-parser-worker'
}

Write-Host '[backend] rebuilding backend image and refreshing docker services'
docker compose -f deploy/docker/docker-compose.yml --env-file $EnvFile up -d --build @services
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$deadline = (Get-Date).AddSeconds(180)
$healthy = $false
while ((Get-Date) -lt $deadline) {
    try {
        $response = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:8080/actuator/health' -TimeoutSec 5
        if ($response.status -eq 'UP') {
            $healthy = $true
            break
        }
    }
    catch {
    }
    Start-Sleep -Seconds 3
}

if (-not $healthy) {
    throw 'Backend health check did not pass within 180 seconds.'
}

Write-Host '[backend] backend is healthy at http://127.0.0.1:8080'
