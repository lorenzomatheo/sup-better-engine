<#
.SYNOPSIS
    Sup Better Engine — Backend startup script (Windows PowerShell).
.DESCRIPTION
    Validates environment, creates venv if needed, installs dependencies,
    runs Alembic migrations + seed, manages port 8000, starts FastAPI.
#>

[CmdletBinding()]
param(
    [switch]$SkipMigrations,
    [switch]$SkipSeed,
    [switch]$Restart
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path (Split-Path -Parent $ScriptDir) "backend"
$LogFile = Join-Path $BackendDir "logs\backend-startup.log"
$PidFile = Join-Path $BackendDir ".backend.pid"
$BackendPort = 8000
$BackendHost = "0.0.0.0"

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

function Test-BackendHealthy($url, $maxRetries = 15, $delaySec = 1) {
    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            $r = Invoke-WebRequest -Uri "$url/health" -UseBasicParsing -TimeoutSec 2
            if ($r.StatusCode -eq 200) { return $true }
        } catch { }
        Start-Sleep -Seconds $delaySec
    }
    return $false
}

# -- Graceful shutdown trap ---------------------------------------------------

$uvicornJob = $null
trap {
    Write-Warn "Interrupted - cleaning up..."
    if ($uvicornJob) { Stop-Process -Id $uvicornJob.Id -Force -ErrorAction SilentlyContinue }
    if (Test-Path $PidFile) { Remove-Item $PidFile -Force }
    Write-Ok "Backend stopped."
    exit 0
}

# -- 0. Restart mode ----------------------------------------------------------

if ($Restart) {
    Write-Info "Restart mode - stopping existing backend..."
    Kill-PortProcess $BackendPort | Out-Null
    if (Test-Path $PidFile) { Remove-Item $PidFile -Force }
}

# -- 1. Environment validation ------------------------------------------------

Write-Info "Validating environment..."
Log "=== Backend startup begin ==="

$envFile = Join-Path $BackendDir ".env"
if (-not (Test-Path $envFile)) {
    $example = Join-Path (Split-Path -Parent $BackendDir) ".env.example"
    if (Test-Path $example) {
        Copy-Item $example $envFile
        Write-Warn "No .env found - copied from .env.example. Review values!"
    } else {
        Write-Err "No .env file and no .env.example found. Create backend/.env manually."
        exit 1
    }
}

# Parse critical vars from .env
$envContent = Get-Content $envFile -Raw
$missingCritical = @()

$requiredVars = @("DATABASE_URL", "SECRET_KEY")
foreach ($var in $requiredVars) {
    if ($envContent -notmatch "(?m)^\s*$var\s*=") {
        $missingCritical += $var
    }
}

if ($missingCritical.Count -gt 0) {
    Write-Err "Missing critical env vars: $($missingCritical -join ', ')"
    Write-Err "Edit backend/.env and set these values."
    exit 1
}

# Warn about placeholder values
if ($envContent -match 'SECRET_KEY=.*change-me') {
    Write-Warn "SECRET_KEY is still a placeholder - fine for dev, change for production."
}
if ($envContent -match 'OPENAI_API_KEY=sk-placeholder') {
    Write-Warn "OPENAI_API_KEY is placeholder - classifier will use stub mode."
}

# Load .env into process environment
foreach ($line in (Get-Content $envFile)) {
    if ($line -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $Matches[1].Trim()
        $val = $Matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
}

Write-Ok "Environment validated"
Log "Environment OK"

# -- 2. Python venv -----------------------------------------------------------

$venvDir = Join-Path $BackendDir ".venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Info "Virtual environment not found - creating .venv..."
    python -m venv $venvDir
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to create venv. Ensure Python 3.12+ is installed and on PATH."
        exit 1
    }
    Write-Ok "Virtual environment created"
} else {
    Write-Ok "Virtual environment found"
}

# -- 3. Install/upgrade dependencies ------------------------------------------

Write-Info "Installing/upgrading dependencies from pyproject.toml..."
& $venvPython -m pip install --upgrade pip --quiet 2>&1 | Out-Null
& $venvPython -m pip install -e "$BackendDir" --quiet 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "pip install failed. Check $LogFile for details."
    Log "pip install FAILED"
    exit 1
}
Write-Ok "Dependencies installed"
Log "Dependencies OK"

# -- 4. Database migrations ---------------------------------------------------

if (-not $SkipMigrations) {
    Write-Info "Running Alembic migrations..."
    Push-Location $BackendDir
    try {
        $alembicOut = & $venvPython -m alembic upgrade head 2>&1
        Log "Alembic: $alembicOut"
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Alembic migration failed (database may not exist yet)."
            Write-Warn "Create the database first: CREATE DATABASE sup_better_engine;"
            Log "Alembic FAILED"
        } else {
            Write-Ok "Migrations up to date"
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Info "Skipping migrations (-SkipMigrations)"
}

# -- 5. Seed data -------------------------------------------------------------

if (-not $SkipSeed) {
    Write-Info "Running seed script..."
    Push-Location $BackendDir
    try {
        $env:PYTHONIOENCODING = "utf-8"
        $seedOut = & $venvPython scripts\seed.py 2>&1
        Log "Seed: $seedOut"
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Seed script returned non-zero. Database may be unreachable."
            Log "Seed FAILED"
        } else {
            Write-Ok "Seed complete"
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Info "Skipping seed (-SkipSeed)"
}

# -- 6. Port management -------------------------------------------------------

$existing = Get-PortProcess $BackendPort
if ($existing) {
    Write-Warn "Port $BackendPort occupied by PID(s): $($existing -join ', ')"
    if (-not (Kill-PortProcess $BackendPort)) {
        Write-Err "Cannot free port $BackendPort. Manual intervention required."
        Write-Err "Run: .\stop-all.ps1 or kill the process manually."
        exit 1
    }
}

# -- 7. Start FastAPI server --------------------------------------------------

Write-Info "Starting FastAPI on ${BackendHost}:${BackendPort}..."
Log "Starting uvicorn..."

$env:PYTHONIOENCODING = "utf-8"

Ensure-Dir (Join-Path $BackendDir "logs")

$uvicornProcess = Start-Process -FilePath $venvPython `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--host", $BackendHost, "--port", $BackendPort `
    -WorkingDirectory $BackendDir `
    -PassThru `
    -RedirectStandardOutput (Join-Path $BackendDir "logs\uvicorn-stdout.log") `
    -RedirectStandardError  (Join-Path $BackendDir "logs\uvicorn-stderr.log") `
    -WindowStyle Hidden

# Save PID
Ensure-Dir (Split-Path -Parent $PidFile)
$uvicornProcess.Id | Out-File -FilePath $PidFile -Force
Log "Uvicorn PID: $($uvicornProcess.Id)"

# -- 8. Health check ----------------------------------------------------------

Write-Info "Waiting for backend to become healthy..."
$backendUrl = "http://localhost:$BackendPort"

if (Test-BackendHealthy $backendUrl) {
    Write-Ok "Backend is UP and healthy at $backendUrl"
    Write-Ok "Swagger UI: ${backendUrl}/docs"
    Log "Backend healthy"
} else {
    Write-Err "Backend did not respond on /health after 15s."
    Write-Err "Check logs: $(Join-Path $BackendDir 'logs\uvicorn-stderr.log')"
    Log "Backend UNHEALTHY"
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  [OK] Backend running - PID $($uvicornProcess.Id)" -ForegroundColor Green
Write-Host "  [API]  $backendUrl" -ForegroundColor Cyan
Write-Host "  [DOCS] ${backendUrl}/docs" -ForegroundColor Cyan
Write-Host "  [HEALTH] ${backendUrl}/health" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
