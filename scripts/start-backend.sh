#!/usr/bin/env bash
# Sup Better Engine — Backend startup script (Unix/macOS/Linux)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/backend"
LOG_DIR="$BACKEND_DIR/logs"
LOG_FILE="$LOG_DIR/backend-startup.log"
PID_FILE="$BACKEND_DIR/.backend.pid"
BACKEND_PORT="${BACKEND_PORT:-8000}"
BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"

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
            # Force kill if still alive
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

wait_healthy() {
    local url=$1
    local max_retries=${2:-15}
    for ((i=1; i<=max_retries; i++)); do
        if curl -sf "$url/health" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done
    return 1
}

# ── Parse flags ──────────────────────────────────────────────────────────────

SKIP_MIGRATIONS=false
SKIP_SEED=false
RESTART=false

for arg in "$@"; do
    case $arg in
        --skip-migrations) SKIP_MIGRATIONS=true ;;
        --skip-seed)       SKIP_SEED=true ;;
        --restart)         RESTART=true ;;
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
    ok "Backend stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── Restart mode ─────────────────────────────────────────────────────────────

if $RESTART; then
    info "Restart mode — stopping existing backend..."
    kill_port "$BACKEND_PORT" || true
    rm -f "$PID_FILE"
fi

# ── 1. Environment validation ───────────────────────────────────────────────

info "Validating environment..."
log "=== Backend startup begin ==="

ENV_FILE="$BACKEND_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
    EXAMPLE_FILE="$(dirname "$BACKEND_DIR")/.env.example"
    if [[ -f "$EXAMPLE_FILE" ]]; then
        cp "$EXAMPLE_FILE" "$ENV_FILE"
        warn "No .env found — copied from .env.example. Review values!"
    else
        err "No .env file and no .env.example found. Create backend/.env manually."
        exit 1
    fi
fi

# Check critical vars
missing=()
for var in DATABASE_URL SECRET_KEY; do
    if ! grep -qE "^\s*$var\s*=" "$ENV_FILE"; then
        missing+=("$var")
    fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
    err "Missing critical env vars: ${missing[*]}"
    err "Edit backend/.env and set these values."
    exit 1
fi

# Warn about placeholders
if grep -qE 'SECRET_KEY=.*change-me' "$ENV_FILE"; then
    warn "SECRET_KEY is still a placeholder — fine for dev, change for production."
fi
if grep -q 'OPENAI_API_KEY=sk-placeholder' "$ENV_FILE"; then
    warn "OPENAI_API_KEY is placeholder — classifier will use stub mode."
fi

# Export .env vars
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

ok "Environment validated"
log "Environment OK"

# ── 2. Python venv ──────────────────────────────────────────────────────────

VENV_DIR="$BACKEND_DIR/.venv"
VENV_PYTHON="$VENV_DIR/bin/python"

if [[ ! -x "$VENV_PYTHON" ]]; then
    info "Virtual environment not found — creating .venv..."
    python3 -m venv "$VENV_DIR"
    ok "Virtual environment created"
else
    ok "Virtual environment found"
fi

# ── 3. Install/upgrade dependencies ────────────────────────────────────────

info "Installing/upgrading dependencies from pyproject.toml..."
"$VENV_PYTHON" -m pip install --upgrade pip --quiet 2>&1 | log "pip upgrade"
"$VENV_PYTHON" -m pip install -e "$BACKEND_DIR" --quiet 2>&1 || {
    err "pip install failed. Check $LOG_FILE"
    log "pip install FAILED"
    exit 1
}
ok "Dependencies installed"
log "Dependencies OK"

# ── 4. Database migrations ─────────────────────────────────────────────────

if ! $SKIP_MIGRATIONS; then
    info "Running Alembic migrations..."
    pushd "$BACKEND_DIR" > /dev/null
    alembic_out=$("$VENV_PYTHON" -m alembic upgrade head 2>&1) || {
        warn "Alembic migration failed (database may not exist yet)."
        warn "Create the database first: CREATE DATABASE sup_better_engine;"
        log "Alembic FAILED"
    }
    log "Alembic: $alembic_out"
    if [[ -z "${alembic_out##*FAILED*}" ]]; then
        : # already warned
    else
        ok "Migrations up to date"
    fi
    popd > /dev/null
else
    info "Skipping migrations (--skip-migrations)"
fi

# ── 5. Seed data ───────────────────────────────────────────────────────────

if ! $SKIP_SEED; then
    info "Running seed script..."
    pushd "$BACKEND_DIR" > /dev/null
    export PYTHONIOENCODING=utf-8
    seed_out=$("$VENV_PYTHON" scripts/seed.py 2>&1) || {
        warn "Seed script returned non-zero. Database may be unreachable."
        log "Seed FAILED"
    }
    log "Seed: $seed_out"
    ok "Seed complete"
    popd > /dev/null
else
    info "Skipping seed (--skip-seed)"
fi

# ── 6. Port management ─────────────────────────────────────────────────────

if ! kill_port "$BACKEND_PORT"; then
    err "Cannot free port $BACKEND_PORT. Manual intervention required."
    err "Run: ./stop-all.sh or kill the process manually."
    exit 1
fi

# ── 7. Start FastAPI server ────────────────────────────────────────────────

info "Starting FastAPI on ${BACKEND_HOST}:${BACKEND_PORT}..."
log "Starting uvicorn..."

mkdir -p "$LOG_DIR"
export PYTHONIOENCODING=utf-8

nohup "$VENV_PYTHON" -m uvicorn app.main:app --reload \
    --host "$BACKEND_HOST" --port "$BACKEND_PORT" \
    > "$LOG_DIR/uvicorn-stdout.log" \
    2> "$LOG_DIR/uvicorn-stderr.log" &

UVICORN_PID=$!
echo "$UVICORN_PID" > "$PID_FILE"
log "Uvicorn PID: $UVICORN_PID"

# ── 8. Health check ────────────────────────────────────────────────────────

info "Waiting for backend to become healthy..."
backend_url="http://localhost:$BACKEND_PORT"

if wait_healthy "$backend_url"; then
    ok "Backend is UP and healthy at $backend_url"
    ok "Swagger UI: ${backend_url}/docs"
    log "Backend healthy"
else
    err "Backend did not respond on /health after 15s."
    err "Check logs: $LOG_DIR/uvicorn-stderr.log"
    log "Backend UNHEALTHY"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅  Backend running — PID $UVICORN_PID"
echo "  📡  API:     $backend_url"
echo "  📖  Docs:    ${backend_url}/docs"
echo "  💚  Health:  ${backend_url}/health"
echo "═══════════════════════════════════════════════"
echo ""
