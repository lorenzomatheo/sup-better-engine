# 03 — Functional Specification: Backoffice

> **Source:** Workshop notes (3 backoffice roles) + DESIGN.md (single Tenant) + inferred operational requirements.
> **Purpose:** Define the functional requirements for the backoffice system, bridging the gap between DESIGN.md's single-Tenant model and the workshop's 3-tier operational structure.

---

## 1. Scope

### IN (Fatia 1 + Backoffice MVP)
- Operator dashboard: session monitoring, lead review
- Leadership dashboard: aggregated metrics, parameter configuration
- Gestão dashboard: go/no-go evidence, compliance overview
- Authentication and RBAC for 3 backoffice roles
- Audit logging for administrative actions

### OUT (Deferred)
- Multi-tenant admin panel (fatia 2+)
- Self-service tenant onboarding
- Real-time chat intervention (handoff ao vivo — DESIGN.md OUT)
- Advanced analytics (funnel analysis, cohort analysis)
- API for third-party integrations (CRM, ERP)

---

## 2. Authentication & Authorization

### 2.1 Authentication Model

| Aspect | Specification |
|--------|---------------|
| Method | Email + password (fatia 1); OAuth/SSO deferred |
| Session | JWT with refresh token, 8h TTL for backoffice |
| MFA | Not required fatia 1; recommended for Gestão role |
| Password policy | Min 12 chars, bcrypt hashing |

### 2.2 Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────┐
│                    RBAC Model                        │
│                                                     │
│  Gestão (Admin)                                     │
│  ├── All Liderança permissions                      │
│  ├── Tenant configuration (billing, contract)       │
│  ├── Go/no-go decision panel                        │
│  └── Compliance report access                       │
│                                                     │
│  Liderança (Manager)                                │
│  ├── All Operador permissions                       │
│  ├── Operator management (CRUD)                     │
│  ├── Operational parameter configuration            │
│  ├── Routing rule management                        │
│  └── Team performance metrics                       │
│                                                     │
│  Operador (Agent/Operator)                          │
│  ├── Session monitoring (read)                      │
│  ├── Lead output review (read)                      │
│  ├── Session flagging/notes (write)                 │
│  └── Daily metrics dashboard (read)                 │
└─────────────────────────────────────────────────────┘
```

### 2.3 Permission Table

| Permission | Operador | Liderança | Gestão |
|------------|:--------:|:---------:|:------:|
| `session.read` | ✅ | ✅ | ✅ |
| `session.flag` | ✅ | ✅ | ✅ |
| `session.note` | ✅ | ✅ | ✅ |
| `lead.read` | ✅ | ✅ | ✅ |
| `lead.export` | ✅ | ✅ | ✅ |
| `counter.read` | ✅ | ✅ | ✅ |
| `counter.configure` | ❌ | ✅ | ✅ |
| `operator.create` | ❌ | ✅ | ✅ |
| `operator.update` |  | ✅ | ✅ |
| `operator.delete` | ❌ | ✅ | ✅ |
| `tenant.configure` | ❌ |  | ✅ |
| `compliance.read` | ❌ | ✅ | ✅ |
| `compliance.export` | ❌ | ❌ | ✅ |
| `audit.read` | ❌ | ✅ | ✅ |

---

## 3. Operator Dashboard (Operador)

### 3.1 Session Monitor

**Purpose:** Real-time visibility into active conversations.

**Data Model:**
```
SessionView {
  session_id: UUID
  status: 'active' | 'idle' | 'expired' | 'rate_limited'
  intent: 'qualificacao' | 'atendimento' | 'agendamento' | 'venda' | 'indefinida' | 'nenhuma'
  turn_count: int
  time_active: duration
  origem: string | 'desconhecido'
  email_state: 'nao_pedido' | 'pedido_sem_envio' | 'enviado_recusado' | 'enviado_aceito'
  last_message_at: timestamp
  flagged: boolean
  internal_notes: string[]
}
```

**UI Requirements:**
- Auto-refresh every 30s (configurable)
- Sortable columns: time_active (desc default), turn_count, intent
- Filter: by intent, by status, by flagged
- Visual indicators:
  - 🔴 Red: session > 80% of TTL or > 80% of turn limit
  - 🟡 Yellow: session > 50% of TTL or > 50% of turn limit
  - 🟢 Green: normal

**Actions:**
- Flag session for review → creates audit log entry
- Add internal note → attached to lead record if identified
- View session transcript (until TTL expiry)

### 3.2 Lead Review

**Purpose:** Review and prioritize identified leads for commercial follow-up.

**Data Model:**
```
LeadView {
  lead_id: UUID
  email: string (normalized)
  intent: string
  urgency: string | null
  fit: string | null
  qualification_output: JSON
  created_at: timestamp
  origem: string
  session_count: int
  consent_recorded: boolean
  consent_purpose: string
}
```

**UI Requirements:**
- Table view with sortable columns
- Filter: by intent, urgency, fit, date range, origem
- Bulk export: CSV with all lead fields
- Detail view: full qualification output + session history

**Actions:**
- Mark as "contacted" (status update)
- Add CRM note
- Export selected leads (CSV)

### 3.3 Daily Metrics

**Purpose:** Operational awareness of daily platform performance.

**Metrics Displayed:**
| Metric | Source | Update Frequency |
|--------|--------|-----------------|
| Sessions today | Counter bucket | Real-time |
| Valid sessions today | Counter bucket | Real-time |
| Excluded (rate limit) | Edge counter | Real-time |
| Excluded (turn limit) | Edge counter | Real-time |
| Leads identified today | Lead table count | Real-time |
| Intent distribution today | Counter bucket | Hourly |
| Email state distribution | Counter bucket | Hourly |

---

## 4. Leadership Dashboard (Liderança)

### 4.1 Performance Metrics

**Purpose:** Strategic oversight of platform performance and team effectiveness.

**Weekly View:**
- Sessions/week (from snapshot series)
- Lead conversion rate (leads / valid sessions)
- Intent distribution (pie chart with CI bars)
- Email state distribution
- Top `origem` sources

**Monthly View:**
- Trend lines: sessions, leads, conversion rate
- Week-over-week change (%)
- Cumulative totals vs go/no-go thresholds

**Drill-Down:**
- Click any metric → filter session monitor by that dimension
- Cross-filter: intent × origem, intent × email_state

### 4.2 Parameter Configuration

**Purpose:** Adjust operational parameters without code deployment.

**Configurable Parameters:**

| Parameter | Current Value (DESIGN.md) | Allowed Range | Impact |
|-----------|--------------------------|---------------|--------|
| Session TTL | 24h | 1h – 72h | Affects session expiry, counter emission |
| Rate limit (IP/hour) | 30 | 10 – 100 | Affects abuse protection |
| Turn limit (session) | Variable (40 default) | 10 – 100 | Affects conversation depth |
| Email modal trigger turn | 4 | 2 – 10 | Affects email collection timing |
| Max email modal displays | 2 | 1 – 5 | Affects consent attempts |

**Change Management:**
- All changes require confirmation dialog
- Change logged: who, when, old value, new value, reason
- Changes take effect within 5 minutes (cache TTL)
- Rollback: revert to previous value via UI

### 4.3 Operator Management

**Purpose:** Scale the operational team.

**Features:**
- Operator list: name, email, role, status (active/inactive), last login
- Invite operator: email invite → auto-generated temporary password
- Deactivate operator: preserves audit trail, revokes access immediately
- Role change: Operador ↔ Liderança (Gestão only for Gestão role)

---

## 5. Gestão Dashboard

### 5.1 Go/No-Go Evidence Panel

**Purpose:** Data-driven decision support for pilot evaluation.

**Criteria Display:**

| Criterion | Target | Current | Status | Trend |
|-----------|--------|---------|--------|-------|
| R1: Lead adoption | > 0% (proof of concept) | X% | /🟡/🔴 | ↑/→/↓ |
| R2a: Sessions/week | ≥ 17 (200/12) | X | 🟢/🟡/🔴 | ↑/→/↓ |
| Classifier accuracy | Per-class threshold | X% | 🟢//🔴 | ↑/→/↓ |
| Rate limiting effectiveness | < 5% false positives | X% | /🟡/🔴 | ↑/→/↓ |
| Cost per lead | < budget threshold | R$ X | /🟡/🔴 | ↑/→/↓ |

**Decision Support:**
- Visual go/no-go indicator per criterion
- Overall recommendation (weighted)
- Evidence export (PDF) for stakeholder presentation

### 5.2 Compliance Overview

**Purpose:** Regulatory risk visibility.

**Metrics:**
- Total leads with recorded consent
- Consent purpose breakdown
- Data deletion requests: pending, fulfilled, overdue
- Data retention compliance: sessions expired per policy
- LGPD Art. 18 request SLA adherence

**Actions:**
- Export compliance report (PDF/CSV)
- View deletion request queue
- Acknowledge compliance alerts

---

## 6. Audit Logging

### 6.1 Logged Events

| Event | Actor | Data Captured |
|-------|-------|---------------|
| Login success/failure | All | IP, timestamp, user-agent |
| Parameter change | Liderança, Gestão | Old value, new value, reason |
| Operator CRUD | Liderança, Gestão | Target user, action, timestamp |
| Session flag | Operador+ | Session ID, reason, timestamp |
| Lead export | All | Record count, format, timestamp |
| Compliance report export | Gestão | Report type, timestamp |
| Role change | Gestão | Target user, old role, new role |

### 6.2 Retention
- Audit logs retained for 24 months
- Immutable (append-only)
- Accessible to Liderança and Gestão roles

---

## 7. Technical Considerations

### 7.1 API Endpoints (Proposed)

```
# Authentication
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/invite          # Liderança+

# Sessions
GET    /api/sessions             # Paginated, filterable
GET    /api/sessions/{id}        # Detail + transcript
PATCH  /api/sessions/{id}/flag   # Flag for review
POST   /api/sessions/{id}/notes  # Add internal note

# Leads
GET    /api/leads                # Paginated, filterable
GET    /api/leads/{id}           # Detail + qualification output
POST   /api/leads/export         # CSV export

# Counters
GET    /api/counters/daily       # Today's counters
GET    /api/counters/weekly      # Weekly snapshots
GET    /api/counters/trends      # Trend data

# Configuration (Liderança+)
GET    /api/config/parameters    # Current parameters
PATCH  /api/config/parameters    # Update parameters

# Operators (Liderança+)
GET    /api/operators            # List
POST   /api/operators/invite     # Invite
PATCH  /api/operators/{id}       # Update role/status
DELETE /api/operators/{id}       # Deactivate

# Compliance (Gestão)
GET    /api/compliance/overview  # Compliance metrics
GET    /api/compliance/requests  # LGPD requests
POST   /api/compliance/export    # Export report

# Audit (Liderança+)
GET    /api/audit/logs           # Paginated audit log
```

### 7.2 Data Access Patterns
- All backoffice queries read from Postgres (no separate read replica for fatia 1)
- Counter reads use pre-aggregated bucket table (fast)
- Session reads filtered by TTL (active sessions only)
- Lead reads indexed by email (normalized) and created_at
