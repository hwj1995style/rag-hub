param(
    [switch]$SkipReindex,
    [switch]$SkipSmoke,
    [switch]$SkipAssert,
    [string]$BackendEndpoint = "http://127.0.0.1:8080"
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $SkipReindex) {
    Write-Host "[1/3] Reindex sample data..."
    & (Join-Path $scriptRoot 'reindex_sample_data.ps1') -BackendEndpoint $BackendEndpoint
}

if (-not $SkipSmoke) {
    Write-Host "[2/3] Run API smoke test..."
    & (Join-Path $scriptRoot 'api_smoke_test.ps1') -BackendEndpoint $BackendEndpoint
}

if (-not $SkipAssert) {
    Write-Host "[3/3] Run API assert test..."
    & (Join-Path $scriptRoot 'api_assert_test.ps1') -BackendEndpoint $BackendEndpoint
}

Write-Host "Local stack verification passed."
