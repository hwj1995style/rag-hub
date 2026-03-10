param(
    [string]$BackendProfile = 'default',
    [string]$BackendPort = '8080',
    [string]$PythonCmd = 'python',
    [switch]$SkipEnvCheck,
    [switch]$InstallPythonDeps,
    [string]$WorkerConfigPath = ''
)

$ErrorActionPreference = 'Stop'

$processEnv = [System.Environment]::GetEnvironmentVariables('Process')
$normalizedPath = $null
foreach ($envKey in $processEnv.Keys) {
    if ($envKey -ieq 'PATH') {
        $normalizedPath = [string]$processEnv[$envKey]
        break
    }
}
if ($null -ne $normalizedPath) {
    [System.Environment]::SetEnvironmentVariable('PATH', $normalizedPath, 'Process')
    [System.Environment]::SetEnvironmentVariable('Path', $null, 'Process')
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.runtime'
$logDir = Join-Path $runtimeDir 'logs'
$toolsDir = Join-Path $repoRoot 'tools'
$javaExe = Join-Path $toolsDir 'jdk-17.0.14+7\bin\java.exe'
$backendJar = Join-Path $repoRoot 'backend\target\rag-hub-backend-0.0.1-SNAPSHOT.jar'
$workerDir = Join-Path $repoRoot 'parser-worker'
$workerEntry = Join-Path $workerDir 'worker.py'
$defaultWorkerConfig = Join-Path $workerDir 'config.yml'
$envScript = Join-Path $PSScriptRoot 'init_backend_env.ps1'
$backendPidFile = Join-Path $runtimeDir 'backend.pid'
$workerPidFile = Join-Path $runtimeDir 'parser-worker.pid'
$backendOutLog = Join-Path $logDir 'backend.out.log'
$backendErrLog = Join-Path $logDir 'backend.err.log'
$workerOutLog = Join-Path $logDir 'parser-worker.out.log'
$workerErrLog = Join-Path $logDir 'parser-worker.err.log'

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

if ($WorkerConfigPath -eq '') {
    $WorkerConfigPath = $defaultWorkerConfig
}

if (-not $SkipEnvCheck) {
    Write-Host 'Running local environment checks...'
    & $envScript -CheckPython -CheckBackend -CheckParserWorker
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

if (-not (Test-Path $javaExe)) {
    throw "Java executable not found: $javaExe"
}
if (-not (Test-Path $backendJar)) {
    throw "Backend jar not found: $backendJar"
}
if (-not (Test-Path $workerEntry)) {
    throw "Parser worker entry not found: $workerEntry"
}
if (-not (Test-Path $WorkerConfigPath)) {
    throw "Parser worker config not found: $WorkerConfigPath"
}

if ($InstallPythonDeps) {
    Write-Host 'Installing parser-worker dependencies...'
    & $PythonCmd -m pip install -r (Join-Path $workerDir 'requirements.txt')
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

$backendArgs = @('-jar', $backendJar, "--spring.profiles.active=$BackendProfile")
if ($BackendPort -ne '') {
    $backendArgs += "--server.port=$BackendPort"
}

Write-Host 'Starting backend process...'
$backendProcess = Start-Process -FilePath $javaExe -WorkingDirectory $repoRoot -ArgumentList $backendArgs -RedirectStandardOutput $backendOutLog -RedirectStandardError $backendErrLog -PassThru
Set-Content -Path $backendPidFile -Value $backendProcess.Id -Encoding ascii

$originalWorkerConfig = [System.Environment]::GetEnvironmentVariable('PARSER_WORKER_CONFIG', 'Process')
[System.Environment]::SetEnvironmentVariable('PARSER_WORKER_CONFIG', $WorkerConfigPath, 'Process')
try {
    Write-Host 'Starting parser worker process...'
    $workerProcess = Start-Process -FilePath $PythonCmd -WorkingDirectory $workerDir -ArgumentList $workerEntry -RedirectStandardOutput $workerOutLog -RedirectStandardError $workerErrLog -PassThru
    Set-Content -Path $workerPidFile -Value $workerProcess.Id -Encoding ascii
}
finally {
    [System.Environment]::SetEnvironmentVariable('PARSER_WORKER_CONFIG', $originalWorkerConfig, 'Process')
}

Write-Host 'Local services launched.'
Write-Host "Backend expected: http://localhost:$BackendPort"
Write-Host "Backend logs: $backendOutLog / $backendErrLog"
Write-Host "Worker logs:  $workerOutLog / $workerErrLog"
Write-Host "Backend PID file: $backendPidFile"
Write-Host "Worker PID file:  $workerPidFile"