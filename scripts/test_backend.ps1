param(
    [switch]$Clean,
    [switch]$SkipTests,
    [string]$MavenGoal = 'test'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot 'backend'
$toolsDir = Join-Path $repoRoot 'tools'
$mavenHome = Join-Path $toolsDir 'apache-maven-3.9.13'
$javaHome = Join-Path $toolsDir 'jdk-17.0.14+7'
$mvnCmd = Join-Path $mavenHome 'bin\mvn.cmd'

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
$goals += $MavenGoal
if ($SkipTests) {
    $goals += '-DskipTests'
}

Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "Running Maven goals: $($goals -join ' ')"

Push-Location $backendDir
try {
    & $mvnCmd @goals
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}