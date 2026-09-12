<#
.SYNOPSIS
    Sup Better Engine — Start all services (backend + frontend).
.DESCRIPTION
    Entry point that launches both backend and frontend in sequence.
    Backend starts first; frontend waits for backend health confirmation.
.PARAMETER SkipMigrations
    Skip Alembic database migrations.
.PARAMETER SkipSeed
    Skip database seed script.
.PARAMETER SkipBackendCheck
    Skip backend health check in frontend script.
.PARAMETER SkipBuildCheck
    Skip TypeScript build check in frontend script.
.PARAMETER BackendOnly
    Start only the backend.
.PARAMETER FrontendOnly
    Start only the frontend.
.PARAMETER Restart
    Kill existing processes on occupied ports before starting.
.EXAMPLE
    .\start-all.ps1
    .\start-all.ps1 -Restart
    .\start-all.ps1 -BackendOnly
    .\start-all.ps1 -SkipMigrations -SkipBuildCheck
#>

[CmdletBinding()]
param(
    [switch]$SkipMigrations,
    [switch]$SkipSeed,
    [switch]$SkipBackendCheck,
    [switch]$SkipBuildCheck,
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$Restart
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Ok($msg)   { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Err($msg)  { Write-Host "[ERR]  $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Magenta
Write-Host "     Sup Better Engine - Full Stack Start" -ForegroundColor Magenta
Write-Host "=====================================================" -ForegroundColor Magenta
Write-Host ""

# -- Backend ------------------------------------------------------------------

if (-not $FrontendOnly) {
    Write-Info "Starting backend..."
    $backendArgs = @()
    if ($SkipMigrations) { $backendArgs += "-SkipMigrations" }
    if ($SkipSeed)       { $backendArgs += "-SkipSeed" }
    if ($Restart)        { $backendArgs += "-Restart" }

    & "$ScriptDir\start-backend.ps1" @backendArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Backend failed to start. Aborting."
        exit 1
    }
    Write-Host ""
}

# -- Frontend -----------------------------------------------------------------

if (-not $BackendOnly) {
    Write-Info "Starting frontend..."
    $frontendArgs = @()
    if ($SkipBackendCheck)  { $frontendArgs += "-SkipBackendCheck" }
    if ($SkipBuildCheck)    { $frontendArgs += "-SkipBuildCheck" }
    if ($Restart)           { $frontendArgs += "-Restart" }

    & "$ScriptDir\start-frontend.ps1" @frontendArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Frontend failed to start."
        exit 1
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "          All services are running!" -ForegroundColor Green
Write-Host "-----------------------------------------------------" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Docs:     http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Info "Press Ctrl+C to stop all services."

# -- Wait for Ctrl+C ----------------------------------------------------------

try {
    while ($true) { Start-Sleep -Seconds 5 }
} finally {
    Write-Host ""
    Write-Info "Stopping all services..."
    & "$ScriptDir\stop-all.ps1"
}
