<#
.SYNOPSIS
    Sup Better Engine — Stop all services cleanly.
.DESCRIPTION
    Reads PID files and terminates backend/frontend processes.
    Falls back to port-based kill if PID files are missing.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "SilentlyContinue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path (Split-Path -Parent $ScriptDir) "backend"
$FrontendDir = Join-Path (Split-Path -Parent $ScriptDir) "frontend"
$BackendPidFile = Join-Path $BackendDir ".backend.pid"
$FrontendPidFile = Join-Path $FrontendDir ".frontend.pid"
$BackendPort = 8000
$FrontendPort = 3000

function Write-Ok($msg)   { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }

Write-Host ""
Write-Info "Stopping Sup Better Engine services..."
Write-Host ""

$stopped = 0

# -- Stop backend -------------------------------------------------------------

Write-Info "Stopping backend (port $BackendPort)..."

# Try PID file first
if (Test-Path $BackendPidFile) {
    $pid = (Get-Content $BackendPidFile -Raw).Trim()
    if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $pid -Force
        Write-Ok "Backend stopped (PID $pid)"
        $stopped++
    }
    Remove-Item $BackendPidFile -Force -ErrorAction SilentlyContinue
}

# Fallback: kill anything on the port
$pids = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $pids) {
    if ($p -ne 0) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Ok "Killed leftover backend PID $p"
        $stopped++
    }
}

if ($stopped -eq 0) { Write-Info "Backend was not running." }

# -- Stop frontend ------------------------------------------------------------

$feStopped = 0
Write-Info "Stopping frontend (port $FrontendPort)..."

if (Test-Path $FrontendPidFile) {
    $pid = (Get-Content $FrontendPidFile -Raw).Trim()
    if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $pid -Force
        Write-Ok "Frontend stopped (PID $pid)"
        $feStopped++
    }
    Remove-Item $FrontendPidFile -Force -ErrorAction SilentlyContinue
}

$pids = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $pids) {
    if ($p -ne 0) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Ok "Killed leftover frontend PID $p"
        $feStopped++
    }
}

if ($feStopped -eq 0) { Write-Info "Frontend was not running." }

Write-Host ""
Write-Ok "All services stopped."
Write-Host ""
