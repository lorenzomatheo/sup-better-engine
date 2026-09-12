# Sup Better Engine

Plataforma de conversa com leads — classificação de intenção, qualificação e identificação contextual.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS |
| Backend | FastAPI (Python 3.12) + SQLAlchemy 2.0 async |
| Database | PostgreSQL 18 |
| Auth | JWT (8h access + 7d refresh) + bcrypt |

## Quick Start

### Prerequisites

- **Python 3.12+**
- **Node.js 24+** / npm
- **PostgreSQL 18** running on port **5433**

### Automated Startup (Recommended)

Startup scripts in `scripts/` handle the full deployment pipeline — venv creation, dependency installation, migrations, seed, port management, and health checks.

#### Windows (PowerShell 7+)

```powershell
# Start everything
.\scripts\start-all.ps1

# Start only backend / frontend
.\scripts\start-all.ps1 -BackendOnly
.\scripts\start-all.ps1 -FrontendOnly

# Restart (kill existing + start fresh)
.\scripts\start-all.ps1 -Restart

# Stop all services
.\scripts\stop-all.ps1
```

#### macOS / Linux

```bash
# Make scripts executable (first time only)
chmod +x scripts/*.sh

# Start everything
./scripts/start-all.sh

# Start only backend / frontend
./scripts/start-all.sh --backend-only
./scripts/start-all.sh --frontend-only

# Restart (kill existing + start fresh)
./scripts/start-all.sh --restart

# Stop all services
./scripts/stop-all.sh
```

#### Script Flags

| Flag | Applies to | Effect |
|------|-----------|--------|
| `--skip-migrations` / `-SkipMigrations` | Backend | Skip Alembic migrations |
| `--skip-seed` / `-SkipSeed` | Backend | Skip database seed |
| `--skip-backend-check` / `-SkipBackendCheck` | Frontend | Don't verify backend health before starting |
| `--skip-build-check` / `-SkipBuildCheck` | Frontend | Skip TypeScript type check |
| `--restart` / `-Restart` | All | Kill existing processes on ports before starting |
| `--backend-only` / `-BackendOnly` | All | Start only the backend |
| `--frontend-only` / `-FrontendOnly` | All | Start only the frontend |

#### What the scripts do

**Backend** (`start-backend`):
1. Validates `.env` exists with required vars (`DATABASE_URL`, `SECRET_KEY`)
2. Creates Python venv if missing, installs deps from `pyproject.toml`
3. Runs `alembic upgrade head` (migrations)
4. Runs `scripts/seed.py` (dev data — safe to re-run)
5. Kills any process on port 8000
6. Starts uvicorn with `--reload`
7. Polls `/health` until healthy (15s timeout)

**Frontend** (`start-frontend`):
1. Checks backend is responding on `localhost:8000/health`
2. Runs `npm install` if `node_modules/` is missing
3. Runs `tsc --noEmit` type check (skippable)
4. Kills any process on port 3000
5. Starts `next dev`
6. Polls `localhost:3000` until ready

**Logs** are written to `backend/logs/` and `frontend/logs/`.

### Manual Startup

If you prefer to start services individually:

### 1. Database Setup

```powershell
# Create database (if not exists)
# Connect to PostgreSQL on port 5433 and run:
# CREATE DATABASE sup_better_engine;

# Run seed script (creates tables + dev data)
cd backend
$env:PYTHONIOENCODING='utf-8'
.\.venv\Scripts\python.exe scripts\seed.py
```

**Seed credentials:**
| User | Password | Role |
|------|----------|------|
| `operador@supbetter.com` | `pilot2026!` | Operador (6 perms) |
| `lideranca@supbetter.com` | `pilot2026!` | Liderança (12 perms) |
| `gestao@supbetter.com` | `pilot2026!` | Gestão (14 perms) |

### 2. Backend

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- Health: http://localhost:8000/health

### 3. Frontend

```powershell
cd frontend
npm run dev
```

- Chat: http://localhost:3000
- Chat with campaign: http://localhost:3000?origem=whatsapp-q3
- Backoffice: http://localhost:3000/backoffice

### 4. Environment

Backend `.env` (already configured):
```
DATABASE_URL=postgresql+asyncpg://postgres:Spysec%402k12@localhost:5433/sup_better_engine
CLASSIFIER_MODE=stub   # or "llm" for OpenAI
```

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │
│  Next.js 16  │     │  FastAPI     │     │  Port 5433   │
│  Port 3000   │     │  Port 8000   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Key Components

- **Intent Classifier** — 5-value stub (qualificacao, atendimento, agendamento, venda, indefinida)
- **Message Router** — Per-message routing with counter aggregation
- **Session Manager** — TTL-based ephemeral sessions (24h default)
- **Email Modal** — Contextual collection with LGPD consent (max 2 displays/turn 4 trigger)
- **Counter System** — Atomic upsert buckets (4 dimensions: origem × intenção × email × sessão)
- **Lead Service** — Dedup by normalized email, consent tracking
- **TTL Sweep** — Background task (5min interval) expires sessions + emits terminal counters
- **Backoffice RBAC** — 3-tier roles: Operador, Liderança, Gestão

## API Endpoints (21 total)

### Chat (public)
- `POST /api/chat/message` — Send message, get response
- `POST /api/chat/email` — Submit email for lead identification
- `GET /api/chat/session/{id}` — Get session state

### Auth
- `POST /api/auth/login` — JWT login
- `POST /api/auth/refresh` — Refresh tokens

### Backoffice (authenticated + RBAC)
- `GET/PATCH /api/sessions` — Session monitoring
- `GET /api/leads` — Lead list + CSV export
- `GET /api/counters/daily|weekly|trends` — Analytics
- `GET/PATCH /api/config/parameters` — Operational config
- `GET/POST/PATCH/DELETE /api/operators` — Team management
- `GET /api/audit/logs` — Audit trail

## SDD Documents

Full specifications in `docs/sdd/`:
- `01-actors-and-roles.md` — Actor taxonomy + RBAC matrix
- `02-user-stories.md` — 17 user stories (MoSCoW)
- `03-functional-spec-backoffice.md` — Backoffice functional spec
- `04-transfer-workflow.md` — Transfer triggers + config
- `05-campaign-management.md` — CampaignConfig + link attribution
- `06-gap-analysis.md` — Gap resolution + unstated requirements
