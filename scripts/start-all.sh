#!/usr/bin/env bash
# Sup Better Engine — Start all services (backend + frontend)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Parse flags ──────────────────────────────────────────────────────────────

BACKEND_ARGS=()
FRONTEND_ARGS=()
BACKEND_ONLY=false
FRONTEND_ONLY=false

for arg in "$@"; do
    case $arg in
        --skip-migrations)      BACKEND_ARGS+=("--skip-migrations") ;;
        --skip-seed)            BACKEND_ARGS+=("--skip-seed") ;;
        --skip-backend-check)   FRONTEND_ARGS+=("--skip-backend-check") ;;
        --skip-build-check)     FRONTEND_ARGS+=("--skip-build-check") ;;
        --backend-only)         BACKEND_ONLY=true ;;
        --frontend-only)        FRONTEND_ONLY=true ;;
        --restart)              BACKEND_ARGS+=("--restart"); FRONTEND_ARGS+=("--restart") ;;
    esac
done

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║     Sup Better Engine — Full Stack Start     ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# ── Backend ──────────────────────────────────────────────────────────────────

if ! $FRONTEND_ONLY; then
    info_msg="Starting backend..."
    echo "ℹ️  $info_msg"
    bash "$SCRIPT_DIR/start-backend.sh" "${BACKEND_ARGS[@]+"${BACKEND_ARGS[@]}"}"
    echo ""
fi

# ── Frontend ─────────────────────────────────────────────────────────────────

if ! $BACKEND_ONLY; then
    echo "ℹ️  Starting frontend..."
    bash "$SCRIPT_DIR/start-frontend.sh" "${FRONTEND_ARGS[@]+"${FRONTEND_ARGS[@]}"}"
fi

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║          All services are running!           ║"
echo "╠═══════════════════════════════════════════════╣"
echo "║  Backend:  http://localhost:8000             ║"
echo "║  Frontend: http://localhost:3000             ║"
echo "║  Docs:     http://localhost:8000/docs        ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""
echo "ℹ️  Press Ctrl+C to stop all services."

# ── Wait for Ctrl+C ──────────────────────────────────────────────────────────

cleanup() {
    echo ""
    echo "ℹ️  Stopping all services..."
    bash "$SCRIPT_DIR/stop-all.sh"
    exit 0
}
trap cleanup SIGINT SIGTERM

while true; do sleep 5; done
