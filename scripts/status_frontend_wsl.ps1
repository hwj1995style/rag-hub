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
$localhostState = 'down'
$wslNetworkState = 'unknown'
$wslIp = $null
try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port" -TimeoutSec 5
    $localhostState = "up ($($response.StatusCode))"
}
catch {
    if ($_.Exception.Message -like '*(404)*') {
        $localhostState = 'up (404-root)'
    }
}
try {
    $wslIp = (wsl.exe -d $Distro -- bash -lc "hostname -I | awk '{print $1}'" | Out-String).Trim()
}
catch {
    $wslIp = $null
}
if ($wslIp) {
    $wslNetworkState = 'down'
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://$wslIp`:$Port" -TimeoutSec 5
        $wslNetworkState = "up ($($response.StatusCode))"
    }
    catch {
        if ($_.Exception.Message -like '*(404)*') {
            $wslNetworkState = 'up (404-root)'
        }
    }
}
Write-Host "WSL frontend port: $Port"
Write-Host "PID file: $pidFile"
Write-Host $statusText
Write-Host "HTTP localhost: $localhostState"
if ($wslIp) {
    Write-Host "HTTP WSL ($wslIp): $wslNetworkState"
}