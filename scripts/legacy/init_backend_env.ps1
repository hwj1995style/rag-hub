param(
    [switch]$CheckPython,
    [switch]$CheckBackend,
    [switch]$CheckParserWorker
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$toolsDir = Join-Path $repoRoot 'tools'
$javaHome = Join-Path $toolsDir 'jdk-17.0.14+7'
$mavenHome = Join-Path $toolsDir 'apache-maven-3.9.13'
$pythonCmd = 'python'

if (-not $CheckPython -and -not $CheckBackend -and -not $CheckParserWorker) {
    $CheckPython = $true
    $CheckBackend = $true
    $CheckParserWorker = $true
}

function Assert-PathExists {
    param(
        [string]$Label,
        [string]$PathValue
    )
    if (-not (Test-Path $PathValue)) {
        throw "$Label not found: $PathValue"
    }
    Write-Host "[OK] $Label => $PathValue"
}

function Invoke-Check {
    param(
        [string]$Label,
        [scriptblock]$Action
    )
    try {
        & $Action
        Write-Host "[OK] $Label"
    }
    catch {
        Write-Host "[FAIL] $Label => $($_.Exception.Message)"
        throw
    }
}

Write-Host "Repository root: $repoRoot"

if ($CheckBackend) {
    Assert-PathExists -Label 'JDK 17' -PathValue $javaHome
    Assert-PathExists -Label 'Maven' -PathValue (Join-Path $mavenHome 'bin\mvn.cmd')
    Invoke-Check -Label 'java -version' -Action {
        $env:JAVA_HOME = $javaHome
        $env:PATH = "$(Join-Path $javaHome 'bin');$(Join-Path $mavenHome 'bin');$env:PATH"
        & (Join-Path $javaHome 'bin\java.exe') -version | Out-Host
    }
    Invoke-Check -Label 'mvn -version' -Action {
        $env:JAVA_HOME = $javaHome
        $env:PATH = "$(Join-Path $javaHome 'bin');$(Join-Path $mavenHome 'bin');$env:PATH"
        & (Join-Path $mavenHome 'bin\mvn.cmd') -version | Out-Host
    }
}

if ($CheckPython -or $CheckParserWorker) {
    Invoke-Check -Label 'python --version' -Action {
        & $pythonCmd --version | Out-Host
    }
}

if ($CheckParserWorker) {
    Assert-PathExists -Label 'parser-worker config' -PathValue (Join-Path $repoRoot 'parser-worker\config.yml')
    Assert-PathExists -Label 'parser-worker entry' -PathValue (Join-Path $repoRoot 'parser-worker\worker.py')
    Assert-PathExists -Label 'parser-worker requirements' -PathValue (Join-Path $repoRoot 'parser-worker\requirements.txt')
}

Write-Host 'Environment check completed.'