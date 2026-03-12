param(
    [string]$EnvFile = 'deploy/docker/.env.example',
    [switch]$InstallDeps,
    [int]$HealthTimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$envFilePath = Join-Path $repoRoot $EnvFile
if (-not (Test-Path $envFilePath)) {
    throw "Docker env file not found: $envFilePath"
}

Write-Host '[frontend] building frontend dist'
$packageArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $PSScriptRoot 'package_frontend.ps1')
)
if ($InstallDeps) {
    $packageArgs += '-InstallDeps'
}
& powershell @packageArgs
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host '[frontend] rebuilding frontend image and refreshing public nginx entry'
docker compose -f deploy/docker/docker-compose.yml --env-file $EnvFile up -d --build --force-recreate rag-hub-frontend nginx
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$deadline = (Get-Date).AddSeconds($HealthTimeoutSeconds)
$healthy = $false
while ((Get-Date) -lt $deadline) {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1/' -TimeoutSec 5
        if ($response.StatusCode -eq 200 -and $response.Content -match 'rag-hub') {
            $healthy = $true
            break
        }
    }
    catch {
    }
    Start-Sleep -Seconds 3
}

if (-not $healthy) {
    throw "Frontend health check did not pass within $HealthTimeoutSeconds seconds."
}

Write-Host '[frontend] frontend is available at http://127.0.0.1/'