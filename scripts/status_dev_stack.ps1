param(
    [string]$EnvFile = 'deploy/docker/.env.example',
    [string]$FrontendUrl = 'http://127.0.0.1/',
    [string]$BackendUrl = 'http://127.0.0.1:8080/actuator/health'
)

$ErrorActionPreference = 'Stop'

Write-Host '== Docker services =='
docker compose -f deploy/docker/docker-compose.yml --env-file $EnvFile ps

Write-Host ''
Write-Host '== Frontend =='
try {
    $frontend = Invoke-WebRequest -UseBasicParsing -Uri $FrontendUrl -TimeoutSec 5
    Write-Host "frontend: up ($($frontend.StatusCode))"
}
catch {
    Write-Host "frontend: down ($($_.Exception.Message))"
}

Write-Host ''
Write-Host '== Backend health =='
try {
    $response = Invoke-RestMethod -Method Get -Uri $BackendUrl -TimeoutSec 5
    $response | ConvertTo-Json -Depth 6
}
catch {
    Write-Host "backend health check failed: $($_.Exception.Message)"
}
