param(
    [string]$PythonCmd = 'python',
    [switch]$InstallDeps,
    [string]$TestPattern = 'test_*.py'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$workerDir = Join-Path $repoRoot 'parser-worker'
$requirements = Join-Path $workerDir 'requirements.txt'
$testsDir = Join-Path $workerDir 'tests'

if (-not (Test-Path $requirements)) {
    throw "Parser worker requirements not found: $requirements"
}

if (-not (Test-Path $testsDir)) {
    throw "Parser worker tests directory not found: $testsDir"
}

Push-Location $workerDir
try {
    if ($InstallDeps) {
        & $PythonCmd -m pip install -r $requirements
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }

    Write-Host "Running parser-worker tests with $PythonCmd"
    & $PythonCmd -m unittest discover -s tests -p $TestPattern
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}