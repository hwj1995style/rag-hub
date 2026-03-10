param(
    [string]$BackendPort = '8080',
    [switch]$CheckHealth
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.runtime'
$backendPidFile = Join-Path $runtimeDir 'backend.pid'
$workerPidFile = Join-Path $runtimeDir 'parser-worker.pid'

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

Write-Host "Repository root: $repoRoot"

Show-ProcessStatus -Name 'backend' -PidFile $backendPidFile
Show-ProcessStatus -Name 'parser-worker' -PidFile $workerPidFile

try {
    $portInfo = Get-NetTCPConnection -LocalPort ([int]$BackendPort) -ErrorAction Stop | Select-Object -First 1
    if ($null -ne $portInfo) {
        Write-Host "[OK] backend port listening: $BackendPort State=$($portInfo.State)"
    }
    else {
        Write-Host "[FAIL] backend port not listening: $BackendPort"
    }
}
catch {
    Write-Host "[FAIL] backend port not listening: $BackendPort"
}

if ($CheckHealth) {
    $healthUrl = "http://localhost:$BackendPort/actuator/health"
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 5
        $status = if ($null -ne $response.status) { $response.status } else { 'UNKNOWN' }
        Write-Host "[OK] health endpoint: $healthUrl status=$status"
    }
    catch {
        Write-Host "[FAIL] health endpoint unavailable: $healthUrl"
    }
}