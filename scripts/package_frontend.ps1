param(
    [switch]$InstallDeps,
    [string]$OutputDir = ''
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $repoRoot 'frontend'
if ($OutputDir -eq '') {
    $OutputDir = Join-Path $repoRoot 'dist\frontend'
}

$installDepsFlag = if ($InstallDeps) { 'true' } else { 'false' }
$wslCommand = "cd /mnt/d/Projects/rag-hub && INSTALL_DEPS=$installDepsFlag bash scripts/package_frontend_wsl.sh"

wsl.exe -d Ubuntu -- bash -lc $wslCommand
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$archivePath = Join-Path $OutputDir 'rag-hub-frontend-dist.tar.gz'
if (Test-Path $archivePath) {
    Remove-Item $archivePath -Force
}

tar.exe -czf $archivePath -C (Join-Path $frontendDir 'dist') .
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Packaged frontend artifact: $archivePath"