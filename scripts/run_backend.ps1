param(
    [string]$Profile = 'default',
    [switch]$SkipTests,
    [string]$Port = '',
    [string]$AdditionalArgs = '',
    [switch]$UseMaven
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot 'backend'
$toolsDir = Join-Path $repoRoot 'tools'
$mavenHome = Join-Path $toolsDir 'apache-maven-3.9.13'
$javaHome = Join-Path $toolsDir 'jdk-17.0.14+7'
$mvnCmd = Join-Path $mavenHome 'bin\mvn.cmd'
$mavenRepo = Join-Path $repoRoot '.m2\repository'
$targetDir = Join-Path $backendDir 'target'
$packagedJar = Join-Path $targetDir 'rag-hub-backend-0.0.1-SNAPSHOT.jar'

if (-not (Test-Path (Join-Path $javaHome 'bin\java.exe'))) {
    throw "JDK 17 not found: $javaHome"
}

$env:JAVA_HOME = $javaHome
$env:PATH = "$(Join-Path $javaHome 'bin');$(Join-Path $mavenHome 'bin');$env:PATH"

if ((-not $UseMaven) -and (Test-Path $packagedJar)) {
    $javaArgs = @('-jar', $packagedJar, "--spring.profiles.active=$Profile")
    if ($Port -ne '') {
        $javaArgs += "--server.port=$Port"
    }
    if ($AdditionalArgs -ne '') {
        $javaArgs += $AdditionalArgs
    }

    Write-Host "JAVA_HOME=$env:JAVA_HOME"
    Write-Host "Running backend with packaged jar: $packagedJar"
    & (Join-Path $javaHome 'bin\java.exe') @javaArgs
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
    exit 0
}

if (-not (Test-Path $mvnCmd)) {
    throw "Maven not found: $mvnCmd"
}

New-Item -ItemType Directory -Force -Path $mavenRepo | Out-Null

$goals = @('spring-boot:run')
if ($SkipTests) {
    $goals += '-DskipTests'
}
$goals += "-Dmaven.repo.local=$mavenRepo"

$runtimeArgs = @()
$runtimeArgs += "-Dspring-boot.run.profiles=$Profile"
if ($Port -ne '') {
    $runtimeArgs += "-Dspring-boot.run.arguments=--server.port=$Port"
}
if ($AdditionalArgs -ne '') {
    if ($Port -ne '') {
        $runtimeArgs[-1] = $runtimeArgs[-1] + ' ' + $AdditionalArgs
    } else {
        $runtimeArgs += "-Dspring-boot.run.arguments=$AdditionalArgs"
    }
}

Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "MAVEN_REPO_LOCAL=$mavenRepo"
Write-Host "Running backend with profile=$Profile via Maven"

Push-Location $backendDir
try {
    & $mvnCmd @goals @runtimeArgs
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}