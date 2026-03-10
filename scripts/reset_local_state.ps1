param(
    [switch]$IncludePythonCache,
    [switch]$IncludeMavenTarget
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.runtime'
$distDir = Join-Path $repoRoot 'dist'
$backendTargetDir = Join-Path $repoRoot 'backend\target'

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

Remove-PathIfExists -Label 'runtime directory' -PathValue $runtimeDir
Remove-PathIfExists -Label 'dist directory' -PathValue $distDir

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