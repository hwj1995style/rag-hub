param(
    [string]$Distro = 'Ubuntu',
    [string]$Port = '5174'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.runtime'
$pidFile = Join-Path $runtimeDir "wsl-frontend-$Port.pid"
$statusOutput = wsl.exe -d $Distro -- bash -lc "PORT='$Port' bash /mnt/d/Projects/rag-hub/scripts/status_frontend_wsl.sh"
$statusText = ($statusOutput | Out-String).Trim()
$httpState = 'down'
try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port" -TimeoutSec 5
    $httpState = "up ($($response.StatusCode))"
}
catch {
    if ($_.Exception.Message -like '*(404)*') {
        $httpState = 'up (404-root)'
    }
}
Write-Host "WSL frontend port: $Port"
Write-Host "PID file: $pidFile"
Write-Host $statusText
Write-Host "HTTP: $httpState"