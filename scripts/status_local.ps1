param(
    [string]$BackendPort = '8080',
    [string]$FrontendPort = '5173',
    [switch]$CheckHealth
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.runtime'
$backendPidFile = Join-Path $runtimeDir 'backend.pid'
$workerPidFile = Join-Path $runtimeDir 'parser-worker.pid'
$frontendPidFile = Join-Path $runtimeDir 'frontend.pid'

function Show-ProcessStatus {
    param(
        [string]$Name,
        [string]$PidFile
    )

    if (-not (Test-Path $PidFile)) {
        Write-Host "[SKIP] $Name pid file not found: $PidFile"
        return
    }

    $pidValue = (Get-Content -Path $PidFile -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($pidValue)) {
        Write-Host "[SKIP] $Name pid file is empty: $PidFile"
        return
    }

    try {
        $process = Get-Process -Id ([int]$pidValue) -ErrorAction Stop
        Write-Host "[OK] $Name running: PID=$($process.Id) ProcessName=$($process.ProcessName)"
    }
    catch {
        Write-Host "[FAIL] $Name not running for PID=$pidValue"
    }
}

function Show-PortStatus {
    param(
        [string]$Name,
        [int]$Port
    )

    $match = netstat -ano | Select-String ":$Port\s+.*LISTENING"
    if ($match) {
        Write-Host "[OK] $Name port listening: $Port"
    }
    else {
        Write-Host "[FAIL] $Name port not listening: $Port"
    }
}

Write-Host "Repository root: $repoRoot"

Show-ProcessStatus -Name 'backend' -PidFile $backendPidFile
Show-ProcessStatus -Name 'parser-worker' -PidFile $workerPidFile
Show-ProcessStatus -Name 'frontend' -PidFile $frontendPidFile

Show-PortStatus -Name 'backend' -Port ([int]$BackendPort)
Show-PortStatus -Name 'frontend' -Port ([int]$FrontendPort)

if ($CheckHealth) {
    $backendHealth = curl.exe -s -o NUL -w "%{http_code}" "http://127.0.0.1:$BackendPort/actuator/health"
    if ($backendHealth -eq '200') {
        Write-Host "[OK] backend endpoint: http://127.0.0.1:$BackendPort/actuator/health status=$backendHealth"
    }
    else {
        Write-Host "[FAIL] backend endpoint unavailable: http://127.0.0.1:$BackendPort/actuator/health status=$backendHealth"
    }

    $frontendHealth = curl.exe -s -o NUL -w "%{http_code}" "http://127.0.0.1:$FrontendPort/"
    if ($frontendHealth -eq '200') {
        Write-Host "[OK] frontend endpoint: http://127.0.0.1:$FrontendPort/ status=$frontendHealth"
    }
    else {
        Write-Host "[FAIL] frontend endpoint unavailable: http://127.0.0.1:$FrontendPort/ status=$frontendHealth"
    }
}
