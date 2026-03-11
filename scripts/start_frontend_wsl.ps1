param(
    [string]$Distro = 'Ubuntu',
    [string]$Port = '5174',
    [string]$ProxyTarget = 'http://127.0.0.1:18080',
    [switch]$InstallDeps
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $repoRoot '.runtime'
$logDir = Join-Path $runtimeDir 'logs'
$outLog = Join-Path $logDir "wsl-frontend-$Port.out.log"
$errLog = Join-Path $logDir "wsl-frontend-$Port.err.log"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

if ($InstallDeps) {
    wsl.exe -d $Distro -- bash -lc 'cd /mnt/d/Projects/rag-hub/frontend && if [ -d node_modules/@esbuild/win32-x64 ]; then rm -rf node_modules; fi && PATH=$HOME/.local/node24/bin:/usr/bin:/bin $HOME/.local/node24/bin/node $HOME/.local/node24/lib/node_modules/npm/bin/npm-cli.js install'
}

$startOutput = wsl.exe -d $Distro -- bash -lc "PORT='$Port' PROXY_TARGET='$ProxyTarget' bash /mnt/d/Projects/rag-hub/scripts/start_frontend_wsl.sh"
if (($startOutput | Out-String).Trim() -like 'already-running:*') {
    throw "WSL frontend is already running on port $Port."
}

$ready = $false
for ($index = 0; $index -lt 30; $index++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    }
    catch {
        if ($_.Exception.Message -like '*(404)*') {
            $ready = $true
            break
        }
    }
}

if (-not $ready) {
    throw "WSL frontend did not become ready. Check $outLog and $errLog"
}

Write-Host "Frontend available at http://127.0.0.1:$Port"
Write-Host "Logs: $outLog"