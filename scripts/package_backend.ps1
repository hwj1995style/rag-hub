param(
    [switch]$Clean,
    [switch]$SkipTests = $true,
    [string]$OutputDir = ''
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot 'backend'
$toolsDir = Join-Path $repoRoot 'tools'
$mavenHome = Join-Path $toolsDir 'apache-maven-3.9.13'
$javaHome = Join-Path $toolsDir 'jdk-17.0.14+7'
$mvnCmd = Join-Path $mavenHome 'bin\mvn.cmd'
$defaultOutputDir = Join-Path $repoRoot 'dist\backend'
if ($OutputDir -eq '') {
    $OutputDir = $defaultOutputDir
}

if (-not (Test-Path $mvnCmd)) {
    throw "Maven not found: $mvnCmd"
}

if (-not (Test-Path (Join-Path $javaHome 'bin\java.exe'))) {
    throw "JDK 17 not found: $javaHome"
}

$env:JAVA_HOME = $javaHome
$env:PATH = "$(Join-Path $javaHome 'bin');$(Join-Path $mavenHome 'bin');$env:PATH"

$goals = @()
if ($Clean) {
    $goals += 'clean'
}
$goals += 'package'
if ($SkipTests) {
    $goals += '-DskipTests'
}

Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "Packaging backend to $OutputDir"

Push-Location $backendDir
try {
    & $mvnCmd @goals
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
    $jar = Get-ChildItem -Path (Join-Path $backendDir 'target') -Filter 'rag-hub-backend-*.jar' |
        Where-Object { $_.Name -notlike '*original*' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $jar) {
        throw 'Packaged jar not found in backend\target'
    }

    Copy-Item -Path $jar.FullName -Destination (Join-Path $OutputDir $jar.Name) -Force
    Write-Host "Packaged jar: $(Join-Path $OutputDir $jar.Name)"
}
finally {
    Pop-Location
}