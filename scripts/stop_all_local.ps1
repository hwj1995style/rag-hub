param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.runtime'
$pidFiles = @(
    @{ Name = 'backend'; Path = (Join-Path $runtimeDir 'backend.pid') },
    @{ Name = 'parser-worker'; Path = (Join-Path $runtimeDir 'parser-worker.pid') },
    @{ Name = 'frontend'; Path = (Join-Path $runtimeDir 'frontend.pid') }
)

foreach ($entry in $pidFiles) {
    $name = $entry.Name
    $pidFile = $entry.Path

    if (-not (Test-Path $pidFile)) {
        Write-Host "[SKIP] $name pid file not found: $pidFile"
        continue
    }

    $pidValue = (Get-Content -Path $pidFile -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($pidValue)) {
        Write-Host "[SKIP] $name pid file is empty: $pidFile"
        Remove-Item -Path $pidFile -Force
        continue
    }

    try {
        $process = Get-Process -Id ([int]$pidValue) -ErrorAction Stop
        if ($Force) {
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
        }
        else {
            Stop-Process -Id $process.Id -ErrorAction Stop
        }
        Write-Host "[OK] Stopped $name process PID=$($process.Id)"
    }
    catch {
        Write-Host "[SKIP] $name process not running for PID=$pidValue"
    }
    finally {
        if (Test-Path $pidFile) {
            Remove-Item -Path $pidFile -Force
        }
    }
}
