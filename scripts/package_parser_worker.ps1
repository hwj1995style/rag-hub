param(
    [string]$PythonCmd = 'python',
    [switch]$InstallDeps
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$workerDir = Join-Path $repoRoot 'parser-worker'
$distDir = Join-Path $repoRoot 'dist\parser-worker'
$packageRoot = Join-Path $distDir 'bundle'
$archivePath = Join-Path $distDir 'parser-worker.zip'
$requirements = Join-Path $workerDir 'requirements.txt'

if (-not (Test-Path $workerDir)) {
    throw "Parser worker directory not found: $workerDir"
}

if ($InstallDeps) {
    & $PythonCmd -m pip install -r $requirements
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

New-Item -ItemType Directory -Force -Path $packageRoot | Out-Null

$itemsToCopy = @(
    (Join-Path $workerDir 'parser_worker'),
    (Join-Path $workerDir 'tests'),
    (Join-Path $workerDir 'worker.py'),
    (Join-Path $workerDir 'config.yml'),
    (Join-Path $workerDir 'requirements.txt'),
    (Join-Path $workerDir 'README.md')
)

foreach ($item in $itemsToCopy) {
    if (-not (Test-Path $item)) {
        throw "Required package item not found: $item"
    }
    Copy-Item -Path $item -Destination $packageRoot -Recurse -Force
}

if (Test-Path $archivePath) {
    Remove-Item -Path $archivePath -Force
}

Compress-Archive -Path (Join-Path $packageRoot '*') -DestinationPath $archivePath -Force

Write-Host "Parser worker package created:"
Write-Host "  bundle: $packageRoot"
Write-Host "  zip:    $archivePath"