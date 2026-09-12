#!/usr/bin/env bash
# Sup Better Engine — Frontend startup script (Unix/macOS/Linux)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/frontend"
LOG_DIR="$FRONTEND_DIR/logs"
LOG_FILE="$LOG_DIR/frontend-startup.log"
PID_FILE="$FRONTEND_DIR/.frontend.pid"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

# ── Helpers ──────────────────────────────────────────────────────────────────

ok()   { echo "✅ $1"; }
warn() { echo "⚠️  $1"; }
err()  { echo "❌ $1"; }
info() { echo "ℹ️  $1"; }

log() {
    mkdir -p "$LOG_DIR"
    echo "$(date '+%Y-%m-%d %H:%M:%S')  $*" >> "$LOG_FILE"
}

kill_port() {
    local port=$1
    local pids
    if command -v lsof &>/dev/null; then
        pids=$(lsof -ti :"$port" 2>/dev/null || true)
    elif command -v fuser &>/dev/null; then
        pids=$(fuser "$port"/tcp 2>/dev/null | tr -d ' ' || true)
    else
        warn "Neither lsof nor fuser found — cannot check port $port"
        return 0
    fi

    if [[ -z "$pids" ]]; then return 0; fi

    warn "Port $port in use by PID(s): $pids. Killing..."
    for pid in $pids; do
        if kill -15 "$pid" 2>/dev/null; then
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            ok "Killed PID $pid"
        else
            err "Cannot kill PID $pid"
            return 1
        fi
    done
    return 0
}

# ── Parse flags ──────────────────────────────────────────────────────────────

SKIP_BACKEND_CHECK=false
SKIP_BUILD_CHECK=false
RESTART=false

for arg in "$@"; do
    case $arg in
        --skip-backend-check) SKIP_BACKEND_CHECK=true ;;
        --skip-build-check)   SKIP_BUILD_CHECK=true ;;
        --restart)            RESTART=true ;;
    esac
done

# ── Graceful shutdown trap ───────────────────────────────────────────────────

cleanup() {
    warn "Interrupted — cleaning up..."
    if [[ -f "$PID_FILE" ]]; then
        local pid
        pid=$(cat "$PID_FILE")
        kill "$pid" 2>/dev/null || true
        rm -f "$PID_FILE"
    fi
    ok "Frontend stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── Restart mode ─────────────────────────────────────────────────────────────

if $RESTART; then
    info "Restart mode — stopping existing frontend..."
    kill_port "$FRONTEND_PORT" || true
    rm -f "$PID_FILE"
fi

# ── 1. Backend dependency check ────────────────────────────────────────────

info "Checking backend health..."
log "=== Frontend startup begin ==="

if ! $SKIP_BACKEND_CHECK; then
    backend_url="http://localhost:$BACKEND_PORT"
    if curl -sf "$backend_url/health" >/dev/null 2>&1; then
        ok "Backend is running at $backend_url"
    else
        err "Backend is NOT responding at $backend_url/health"
        err "Start the backend first: ./start-backend.sh"
        err "Or skip this check with: ./start-frontend.sh --skip-backend-check"
        log "Backend check FAILED"
        exit 1
    fi
else
    info "Skipping backend check (--skip-backend-check)"
fi

# ── 2. Node.js check ───────────────────────────────────────────────────────

if ! command -v node &>/dev/null; then
    err "Node.js not found on PATH. Install Node.js 24+ first."
    exit 1
fi
node_version=$(node --version)
ok "Node.js $node_version"

# ── 3. Node dependencies ───────────────────────────────────────────────────

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    info "node_modules not found — running npm install..."
    pushd "$FRONTEND_DIR" > /dev/null
    npm install 2>&1 | while IFS= read -r line; do log "npm: $line"; done || {
        err "npm install failed. Check $LOG_FILE"
        log "npm install FAILED"
        popd > /dev/null
        exit 1
    }
    popd > /dev/null
    ok "Dependencies installed"
else
    ok "node_modules found"
fi
log "Dependencies OK"

# ── 4. Optional build check ────────────────────────────────────────────────

if $SKIP_BUILD_CHECK; then
    info "Skipping build check (--skip-build-check)"
else
    info "Running quick TypeScript type check..."
    pushd "$FRONTEND_DIR" > /dev/null
    if ! npx tsc --noEmit 2>&1; then
        warn "TypeScript errors detected. Fix errors or use --skip-build-check to bypass."
        log "TypeScript check FAILED"
    else
        ok "TypeScript check passed"
    fi
    popd > /dev/null
fi

# ── 5. Port management ─────────────────────────────────────────────────────

if ! kill_port "$FRONTEND_PORT"; then
    err "Cannot free port $FRONTEND_PORT. Manual intervention required."
    err "Run: ./stop-all.sh or kill the process manually."
    exit 1
fi

# ── 6. Start Next.js dev server ────────────────────────────────────────────

info "Starting Next.js dev server on port $FRONTEND_PORT..."
log "Starting next dev..."

mkdir -p "$LOG_DIR"

pushd "$FRONTEND_DIR" > /dev/null
nohup npx next dev --port "$FRONTEND_PORT" \
    > "$LOG_DIR/next-stdout.log" \
    2> "$LOG_DIR/next-stderr.log" &

NEXT_PID=$!
popd > /dev/null

echo "$NEXT_PID" > "$PID_FILE"
log "Next.js PID: $NEXT_PID"

# ── 7. Wait for ready ──────────────────────────────────────────────────────

info "Waiting for frontend to become ready..."
frontend_url="http://localhost:$FRONTEND_PORT"
ready=false

for ((i=1; i<=20; i++)); do
    if curl -sf "$frontend_url" >/dev/null 2>&1; then
        ready=true
        break
    fi
    sleep 1
done

if $ready; then
    ok "Frontend is UP at $frontend_url"
    log "Frontend healthy"
else
    warn "Frontend may still be compiling. Check $frontend_url in your browser."
    warn "Logs: $LOG_DIR/next-stderr.log"
    log "Frontend UNHEALTHY (may still be compiling)"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅  Frontend running — PID $NEXT_PID"
echo "  🌐  Chat:       $frontend_url"
echo "  🔧  Backoffice: ${frontend_url}/backoffice"
echo "═══════════════════════════════════════════════"
echo ""
