param(
    [switch]$StopServices,
    [switch]$IncludePythonCache,
    [switch]$IncludeMavenTarget
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.runtime'
$distDir = Join-Path $repoRoot 'dist'
$frontendDistDir = Join-Path $repoRoot 'frontend\dist'
$backendTargetDir = Join-Path $repoRoot 'backend\target'
$pidFiles = @(
    @{ Name = 'backend'; Path = (Join-Path $runtimeDir 'backend.pid') },
    @{ Name = 'parser-worker'; Path = (Join-Path $runtimeDir 'parser-worker.pid') },
    @{ Name = 'frontend'; Path = (Join-Path $runtimeDir 'frontend.pid') }
)

function Remove-PathIfExists {
    param(
        [string]$Label,
        [string]$PathValue
    )

    if (Test-Path $PathValue) {
        Remove-Item -Path $PathValue -Recurse -Force
        Write-Host "[OK] Removed $Label => $PathValue"
    }
    else {
        Write-Host "[SKIP] $Label not found => $PathValue"
    }
}

function Stop-TrackedProcesses {
    foreach ($entry in $pidFiles) {
        $name = $entry.Name
        $pidFile = $entry.Path

        if (-not (Test-Path $pidFile)) {
            Write-Host "[SKIP] $name pid file not found => $pidFile"
            continue
        }

        $pidValue = (Get-Content -Path $pidFile -Raw).Trim()
        if ([string]::IsNullOrWhiteSpace($pidValue)) {
            Write-Host "[SKIP] $name pid file is empty => $pidFile"
            Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
            continue
        }

        try {
            $process = Get-Process -Id ([int]$pidValue) -ErrorAction Stop
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
            Write-Host "[OK] Stopped $name process PID=$($process.Id)"
        }
        catch {
            Write-Host "[SKIP] $name process not running for PID=$pidValue"
        }
        finally {
            Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
        }
    }
}

if ($StopServices) {
    Stop-TrackedProcesses
}

Remove-PathIfExists -Label 'runtime directory' -PathValue $runtimeDir
Remove-PathIfExists -Label 'dist directory' -PathValue $distDir
Remove-PathIfExists -Label 'frontend dist directory' -PathValue $frontendDistDir

if ($IncludeMavenTarget) {
    Remove-PathIfExists -Label 'backend target directory' -PathValue $backendTargetDir
}

if ($IncludePythonCache) {
    Get-ChildItem -Path $repoRoot -Recurse -Directory -Force |
        Where-Object { $_.Name -eq '__pycache__' -or $_.Name -eq '.pytest_cache' } |
        ForEach-Object {
            Remove-Item -Path $_.FullName -Recurse -Force
            Write-Host "[OK] Removed Python cache => $($_.FullName)"
        }
}

Write-Host 'Local state reset completed.'
Write-Host 'If you restart with scripts/run_all_local.ps1 -SeedTestData, the in-memory H2 test data will be restored from the seed SQL.'
