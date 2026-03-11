param(
    [string]$Distro = 'Ubuntu',
    [string]$Port = '5174'
)

$ErrorActionPreference = 'Stop'
$stopOutput = (wsl.exe -d $Distro -- bash -lc "PORT='$Port' bash /mnt/d/Projects/rag-hub/scripts/stop_frontend_wsl.sh" | Out-String).Trim()
Write-Host $stopOutput