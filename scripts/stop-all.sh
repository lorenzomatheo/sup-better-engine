#!/usr/bin/env bash
# Sup Better Engine — Stop all services cleanly
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_PID_FILE="$BACKEND_DIR/.backend.pid"
FRONTEND_PID_FILE="$FRONTEND_DIR/.frontend.pid"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

ok()   { echo "✅ $1"; }
info() { echo "ℹ️  $1"; }

kill_port() {
    local port=$1
    local pids
    if command -v lsof &>/dev/null; then
        pids=$(lsof -ti :"$port" 2>/dev/null || true)
    elif command -v fuser &>/dev/null; then
        pids=$(fuser "$port"/tcp 2>/dev/null | tr -d ' ' || true)
    else
        return 0
    fi

    for pid in $pids; do
        kill -15 "$pid" 2>/dev/null || true
    done
    sleep 1
    for pid in $pids; do
        kill -9 "$pid" 2>/dev/null || true
    done
}

echo ""
info "Stopping Sup Better Engine services..."
echo ""

stopped=0

# ── Stop backend ─────────────────────────────────────────────────────────────

info "Stopping backend (port $BACKEND_PORT)..."

if [[ -f "$BACKEND_PID_FILE" ]]; then
    pid=$(cat "$BACKEND_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
        kill -15 "$pid" 2>/dev/null || true
        sleep 1
        kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
        ok "Backend stopped (PID $pid)"
        ((stopped++))
    fi
    rm -f "$BACKEND_PID_FILE"
fi

# Fallback: kill anything on the port
kill_port "$BACKEND_PORT"

# ── Stop frontend ────────────────────────────────────────────────────────────

fe_stopped=0
info "Stopping frontend (port $FRONTEND_PORT)..."

if [[ -f "$FRONTEND_PID_FILE" ]]; then
    pid=$(cat "$FRONTEND_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
        kill -15 "$pid" 2>/dev/null || true
        sleep 1
        kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
        ok "Frontend stopped (PID $pid)"
        ((fe_stopped++))
    fi
    rm -f "$FRONTEND_PID_FILE"
fi

kill_port "$FRONTEND_PORT"

if [[ $fe_stopped -eq 0 ]]; then info "Frontend was not running."; fi

echo ""
ok "All services stopped."
echo ""
