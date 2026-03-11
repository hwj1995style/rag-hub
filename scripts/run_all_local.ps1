param(
    [string]$BackendProfile = 'default',
    [string]$BackendPort = '8080',
    [string]$FrontendPort = '5173',
    [string]$PythonCmd = 'python',
    [switch]$SkipEnvCheck,
    [switch]$InstallPythonDeps,
    [switch]$SkipWorker,
    [switch]$StartFrontend,
    [switch]$InstallFrontendDeps,
    [switch]$RunFrontendBuild,
    [switch]$RebuildBackend,
    [switch]$SeedTestData,
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
$javaHome = Join-Path $toolsDir 'jdk-17.0.14+7'
$javaExe = Join-Path $javaHome 'bin\java.exe'
$mavenHome = Join-Path $toolsDir 'apache-maven-3.9.13'
$mvnCmd = Join-Path $mavenHome 'bin\mvn.cmd'
$mavenRepo = Join-Path $repoRoot '.m2\repository'
$backendJar = Join-Path $repoRoot 'backend\target\rag-hub-backend-0.0.1-SNAPSHOT.jar'
$workerDir = Join-Path $repoRoot 'parser-worker'
$workerEntry = Join-Path $workerDir 'worker.py'
$defaultWorkerConfig = Join-Path $workerDir 'config.yml'
$envScript = Join-Path $PSScriptRoot 'init_backend_env.ps1'
$backendPidFile = Join-Path $runtimeDir 'backend.pid'
$workerPidFile = Join-Path $runtimeDir 'parser-worker.pid'
$frontendPidFile = Join-Path $runtimeDir 'frontend.pid'
$backendOutLog = Join-Path $logDir 'backend.out.log'
$backendErrLog = Join-Path $logDir 'backend.err.log'
$workerOutLog = Join-Path $logDir 'parser-worker.out.log'
$workerErrLog = Join-Path $logDir 'parser-worker.err.log'
$frontendOutLog = Join-Path $logDir 'frontend.out.log'
$frontendErrLog = Join-Path $logDir 'frontend.err.log'
$frontendDir = Join-Path $repoRoot 'frontend'
$nodeDir = 'D:\App\nvm\nvm\v24.10.0'
$nodeExe = Join-Path $nodeDir 'node.exe'
$npmCli = Join-Path $nodeDir 'node_modules\npm\bin\npm-cli.js'
$seedSql = (Join-Path $repoRoot 'backend\src\test\resources\sql\seed-test-data.sql').Replace('\', '/')

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
New-Item -ItemType Directory -Force -Path $mavenRepo | Out-Null

if ($WorkerConfigPath -eq '') {
    $WorkerConfigPath = $defaultWorkerConfig
}

function Stop-TrackedProcess {
    param([string]$PidFile)

    if (-not (Test-Path $PidFile)) {
        return
    }

    $pidValue = (Get-Content -Path $PidFile -Raw).Trim()
    if (-not [string]::IsNullOrWhiteSpace($pidValue)) {
        try {
            Stop-Process -Id ([int]$pidValue) -Force -ErrorAction Stop
        }
        catch {
        }
    }

    Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
}

if (-not $SkipEnvCheck) {
    Write-Host 'Running local environment checks...'
    $envArgs = @('-CheckBackend')
    if (-not $SkipWorker) {
        $envArgs += '-CheckParserWorker'
        $envArgs += '-CheckPython'
    }
    & $envScript @envArgs
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

if (-not (Test-Path $javaExe)) {
    throw "Java executable not found: $javaExe"
}

$env:JAVA_HOME = $javaHome
$env:PATH = "$(Join-Path $javaHome 'bin');$(Join-Path $mavenHome 'bin');$env:PATH"

if ($RebuildBackend -or -not (Test-Path $backendJar)) {
    if (-not (Test-Path $mvnCmd)) {
        throw "Maven not found: $mvnCmd"
    }

    Push-Location (Join-Path $repoRoot 'backend')
    try {
        & $mvnCmd '-q' '-DskipTests' "-Dmaven.repo.local=$mavenRepo" 'package'
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
    finally {
        Pop-Location
    }
}

if (-not (Test-Path $backendJar)) {
    throw "Backend jar not found: $backendJar"
}

if ($StartFrontend) {
    if (-not (Test-Path $nodeExe)) {
        throw "Node 24 not found: $nodeExe"
    }
    if (-not (Test-Path $npmCli)) {
        throw "npm cli not found: $npmCli"
    }

    Push-Location $frontendDir
    try {
        if ($InstallFrontendDeps) {
            & $nodeExe $npmCli install
            if ($LASTEXITCODE -ne 0) {
                exit $LASTEXITCODE
            }
        }

        if ($RunFrontendBuild) {
            & $nodeExe $npmCli run build
            if ($LASTEXITCODE -ne 0) {
                exit $LASTEXITCODE
            }
        }
    }
    finally {
        Pop-Location
    }
}

if (-not $SkipWorker) {
    if (-not (Test-Path $workerEntry)) {
        throw "Parser worker entry not found: $workerEntry"
    }
    if (-not (Test-Path $WorkerConfigPath)) {
        throw "Parser worker config not found: $WorkerConfigPath"
    }

    if ($InstallPythonDeps) {
        & $PythonCmd -m pip install -r (Join-Path $workerDir 'requirements.txt')
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }
}

Stop-TrackedProcess -PidFile $backendPidFile
Stop-TrackedProcess -PidFile $workerPidFile
Stop-TrackedProcess -PidFile $frontendPidFile

$backendArgs = @('-jar', $backendJar, "--spring.profiles.active=$BackendProfile", "--server.port=$BackendPort")
if ($SeedTestData) {
    $backendArgs += '--spring.jpa.defer-datasource-initialization=true'
    $backendArgs += '--spring.sql.init.mode=always'
    $backendArgs += "--spring.sql.init.data-locations=file:/$seedSql"
    $backendArgs += '--kb.security.bootstrap-admin.enabled=false'
}

Write-Host 'Starting backend process...'
$backendProcess = Start-Process -FilePath $javaExe -WorkingDirectory $repoRoot -ArgumentList $backendArgs -RedirectStandardOutput $backendOutLog -RedirectStandardError $backendErrLog -PassThru
Set-Content -Path $backendPidFile -Value $backendProcess.Id -Encoding ascii

$backendHealthy = $false
for ($index = 0; $index -lt 40; $index++) {
    Start-Sleep -Seconds 2
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$BackendPort/actuator/health" -TimeoutSec 5
        if ($health.status -eq 'UP') {
            $backendHealthy = $true
            break
        }
    }
    catch {
    }
}
if (-not $backendHealthy) {
    throw "Backend did not become healthy. Check $backendOutLog and $backendErrLog"
}

if (-not $SkipWorker) {
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
}

if ($StartFrontend) {
    Write-Host 'Starting frontend dev server...'
    $frontendArgs = @($npmCli, 'run', 'dev', '--', '--host', '127.0.0.1', '--port', $FrontendPort)
    $frontendProcess = Start-Process -FilePath $nodeExe -WorkingDirectory $frontendDir -ArgumentList $frontendArgs -RedirectStandardOutput $frontendOutLog -RedirectStandardError $frontendErrLog -PassThru
    Set-Content -Path $frontendPidFile -Value $frontendProcess.Id -Encoding ascii

    $frontendReady = $false
    for ($index = 0; $index -lt 30; $index++) {
        Start-Sleep -Seconds 2
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:$FrontendPort" -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                $frontendReady = $true
                break
            }
        }
        catch {
        }
    }
    if (-not $frontendReady) {
        throw "Frontend dev server did not become ready. Check $frontendOutLog and $frontendErrLog"
    }
}

Write-Host 'Local services launched.'
Write-Host "Backend expected:  http://127.0.0.1:$BackendPort"
if ($StartFrontend) {
    Write-Host "Frontend expected: http://127.0.0.1:$FrontendPort"
}
Write-Host "Backend logs:  $backendOutLog / $backendErrLog"
if (-not $SkipWorker) {
    Write-Host "Worker logs:   $workerOutLog / $workerErrLog"
}
if ($StartFrontend) {
    Write-Host "Frontend logs: $frontendOutLog / $frontendErrLog"
}
