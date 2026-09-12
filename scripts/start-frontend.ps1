<#
.SYNOPSIS
    Sup Better Engine — Frontend startup script (Windows PowerShell).
.DESCRIPTION
    Checks backend health, installs node deps, manages port 3000, starts Next.js dev server.
#>

[CmdletBinding()]
param(
    [switch]$SkipBackendCheck,
    [switch]$SkipBuildCheck,
    [switch]$Restart
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path (Split-Path -Parent $ScriptDir) "frontend"
$LogFile = Join-Path $FrontendDir "logs\frontend-startup.log"
$PidFile = Join-Path $FrontendDir ".frontend.pid"
$FrontendPort = 3000
$BackendPort = 8000

# -- Helpers ------------------------------------------------------------------

function Write-Ok($msg)   { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERR]  $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }

function Ensure-Dir($path) {
    if (-not (Test-Path $path)) { New-Item -ItemType Directory -Force -Path $path | Out-Null }
}

function Log($msg) {
    Ensure-Dir (Split-Path -Parent $LogFile)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts  $msg" | Out-File -Append -FilePath $LogFile -Encoding utf8
}

function Get-PortProcess($port) {
    Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
}

function Kill-PortProcess($port) {
    $pids = Get-PortProcess $port
    if (-not $pids) { return $true }

    Write-Warn "Port $port in use by PID(s): $($pids -join ', '). Attempting graceful kill..."
    foreach ($pid in $pids) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Ok "Killed PID $pid"
        } catch {
            Write-Err "Cannot kill PID $pid - $_"
            return $false
        }
    }
    Start-Sleep -Seconds 1
    return $true
}

# -- Graceful shutdown trap ---------------------------------------------------

trap {
    Write-Warn "Interrupted - cleaning up..."
    if (Test-Path $PidFile) {
        $pid = Get-Content $PidFile -Raw
        Stop-Process -Id ([int]$pid.Trim()) -Force -ErrorAction SilentlyContinue
        Remove-Item $PidFile -Force
    }
    Write-Ok "Frontend stopped."
    exit 0
}

# -- 0. Restart mode ----------------------------------------------------------

if ($Restart) {
    Write-Info "Restart mode - stopping existing frontend..."
    Kill-PortProcess $FrontendPort | Out-Null
    if (Test-Path $PidFile) { Remove-Item $PidFile -Force }
}

# -- 1. Backend dependency check ----------------------------------------------

Write-Info "Checking backend health..."
Log "=== Frontend startup begin ==="

if (-not $SkipBackendCheck) {
    $backendUrl = "http://localhost:$BackendPort"
    try {
        $r = Invoke-WebRequest -Uri "$backendUrl/health" -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) {
            Write-Ok "Backend is running at $backendUrl"
        } else {
            throw "Non-200 response"
        }
    } catch {
        Write-Err "Backend is NOT responding at $backendUrl/health"
        Write-Err "Start the backend first: .\start-backend.ps1"
        Write-Err "Or skip this check with: .\start-frontend.ps1 -SkipBackendCheck"
        Log "Backend check FAILED"
        exit 1
    }
} else {
    Write-Info "Skipping backend check (-SkipBackendCheck)"
}

# -- 2. Node.js check ---------------------------------------------------------

$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Node.js not found on PATH. Install Node.js 24+ first."
    exit 1
}
Write-Ok "Node.js $nodeVersion"

# -- 3. Node dependencies -----------------------------------------------------

$nodeModules = Join-Path $FrontendDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Info "node_modules not found - running npm install..."
    Push-Location $FrontendDir
    npm install 2>&1 | ForEach-Object { Log "npm: $_" }
    if ($LASTEXITCODE -ne 0) {
        Write-Err "npm install failed. Check $LogFile"
        Log "npm install FAILED"
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Ok "Dependencies installed"
} else {
    Write-Ok "node_modules found"
}
Log "Dependencies OK"

# -- 4. Optional build check --------------------------------------------------

if ($SkipBuildCheck) {
    Write-Info "Skipping build check (-SkipBuildCheck)"
} else {
    Write-Info "Running quick TypeScript type check..."
    Push-Location $FrontendDir
    $tscOut = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "TypeScript errors detected:"
        $tscOut | Select-Object -First 10 | ForEach-Object { Write-Warn "  $_" }
        Write-Warn "Fix errors or run with -SkipBuildCheck to bypass."
        Log "TypeScript check FAILED"
    } else {
        Write-Ok "TypeScript check passed"
    }
    Pop-Location
}

# -- 5. Port management -------------------------------------------------------

$existing = Get-PortProcess $FrontendPort
if ($existing) {
    Write-Warn "Port $FrontendPort occupied by PID(s): $($existing -join ', ')"
    if (-not (Kill-PortProcess $FrontendPort)) {
        Write-Err "Cannot free port $FrontendPort. Manual intervention required."
        Write-Err "Run: .\stop-all.ps1 or kill the process manually."
        exit 1
    }
}

# -- 6. Start Next.js dev server ----------------------------------------------

Write-Info "Starting Next.js dev server on port $FrontendPort..."
Log "Starting next dev..."

Ensure-Dir (Join-Path $FrontendDir "logs")

$nextProcess = Start-Process -FilePath "npx" `
    -ArgumentList "next", "dev", "--port", $FrontendPort `
    -WorkingDirectory $FrontendDir `
    -PassThru `
    -RedirectStandardOutput (Join-Path $FrontendDir "logs\next-stdout.log") `
    -RedirectStandardError  (Join-Path $FrontendDir "logs\next-stderr.log") `
    -WindowStyle Hidden

# Save PID
Ensure-Dir (Split-Path -Parent $PidFile)
$nextProcess.Id | Out-File -FilePath $PidFile -Force
Log "Next.js PID: $($nextProcess.Id)"

# -- 7. Wait for ready --------------------------------------------------------

Write-Info "Waiting for frontend to become ready..."
$frontendUrl = "http://localhost:$FrontendPort"
$ready = $false

for ($i = 1; $i -le 20; $i++) {
    try {
        $r = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 1
}

if ($ready) {
    Write-Ok "Frontend is UP at $frontendUrl"
    Log "Frontend healthy"
} else {
    Write-Warn "Frontend may still be compiling. Check $frontendUrl in your browser."
    Write-Warn "Logs: $(Join-Path $FrontendDir 'logs\next-stderr.log')"
    Log "Frontend UNHEALTHY (may still be compiling)"
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  [OK] Frontend running - PID $($nextProcess.Id)" -ForegroundColor Green
Write-Host "  [WEB]   $frontendUrl" -ForegroundColor Cyan
Write-Host "  [ADMIN] ${frontendUrl}/backoffice" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
