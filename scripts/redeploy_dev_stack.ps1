param(
    [string]$EnvFile = 'deploy/docker/.env.example',
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$CleanBackendPackage,
    [switch]$RunBackendTests,
    [switch]$StartFullStack = $true
)

$ErrorActionPreference = 'Stop'

if ($FrontendOnly -and $BackendOnly) {
    throw 'Use either -FrontendOnly or -BackendOnly, not both.'
}

if (-not $FrontendOnly) {
    $backendArgs = @(
        '-ExecutionPolicy', 'Bypass',
        '-File', (Join-Path $PSScriptRoot 'redeploy_backend_docker.ps1'),
        '-EnvFile', $EnvFile
    )
    if ($CleanBackendPackage) {
        $backendArgs += '-CleanPackage'
    }
    if ($RunBackendTests) {
        $backendArgs += '-RunTests'
    }
    if ($StartFullStack) {
        $backendArgs += '-StartFullStack'
    }
    & powershell @backendArgs
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

if (-not $BackendOnly) {
    $frontendArgs = @(
        '-ExecutionPolicy', 'Bypass',
        '-File', (Join-Path $PSScriptRoot 'redeploy_frontend_docker.ps1'),
        '-EnvFile', $EnvFile
    )
    & powershell @frontendArgs
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

Write-Host '[stack] done'
