param(
    [string]$PythonCmd = 'python',
    [switch]$InstallDeps,
    [string]$ConfigPath = '',
    [string]$AdditionalArgs = ''
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$workerDir = Join-Path $repoRoot 'parser-worker'
$requirements = Join-Path $workerDir 'requirements.txt'
$entry = Join-Path $workerDir 'worker.py'
$defaultConfig = Join-Path $workerDir 'config.yml'

if ($ConfigPath -eq '') {
    $ConfigPath = $defaultConfig
}

if (-not (Test-Path $entry)) {
    throw "Parser worker entry not found: $entry"
}

if (-not (Test-Path $requirements)) {
    throw "Parser worker requirements not found: $requirements"
}

if (-not (Test-Path $ConfigPath)) {
    throw "Parser worker config not found: $ConfigPath"
}

Push-Location $workerDir
try {
    if ($InstallDeps) {
        & $PythonCmd -m pip install -r $requirements
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }

    $env:PARSER_WORKER_CONFIG = $ConfigPath
    Write-Host "PARSER_WORKER_CONFIG=$env:PARSER_WORKER_CONFIG"
    Write-Host "Starting parser worker with $PythonCmd"

    if ($AdditionalArgs -ne '') {
        & $PythonCmd $entry $AdditionalArgs
    } else {
        & $PythonCmd $entry
    }

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}