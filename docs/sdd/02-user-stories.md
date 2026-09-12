# 02 — User Stories

> **Source:** Workshop notes actor model + DESIGN.md scope + inferred operational needs.
> **Format:** `As a [actor], I want [action] so that [value].` — with priority (MoSCoW) and acceptance criteria.

---

## 1. Cliente Final (Lead)

### US-CF-01 — Access conversation via link
**As a** Cliente Final, **I want to** open a unique link and start chatting immediately **so that** I can get answers without friction.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Link renders landing page in < 2s on mobile 3G
  - No login, no form, no barrier at entry
  - Chat interface is the primary element on screen
- **DESIGN.md reference:** Scope IN — "Landing por link único, Chat com o agente, iniciando anônimo"

### US-CF-02 — Receive intent-appropriate responses
**As a** Cliente Final, **I want** the agent to understand what I need and respond appropriately **so that** I feel heard and get useful information.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Qualification intent → structured questions about need, urgency, fit
  - Non-qualification intents → graceful fallback acknowledging the request and pointing to tenant contact
  - Undefined intent → clarifying question from agent
- **DESIGN.md reference:** Scope IN — classificador + handler de qualificação + fallback gracioso

### US-CF-03 — Provide email contextually
**As a** Cliente Final, **I want to** be asked for my email at the right moment with a clear value proposition **so that** I understand why I'm sharing it and what I get in return.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Modal appears after handler captures intent/urgency/fit OR at turn 4, whichever comes first
  - Modal displays value proposition (what the tenant's commercial team will do with the info)
  - Maximum 2 displays per session
  - Email validation: syntax + disposable domain blocklist
- **DESIGN.md reference:** Scope IN — mini tela de identificação, validação do e-mail, consentimento como porta

### US-CF-04 — Understand data usage (LGPD)
**As a** Cliente Final, **I want to** know exactly what happens with my email **so that** I can make an informed consent decision.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Modal text states: "seu e-mail serve para o time comercial do tenant retornar sobre esta conversa"
  - No marketing consent collected in fatia 1
  - Sending email = explicit consent act
- **DESIGN.md reference:** Scope IN — consentimento como porta de envio, finalidade restrita

### US-CF-05 — Request data access/deletion (LGPD Art. 18)
**As a** Cliente Final, **I want to** request access to or deletion of my data **so that** my rights under LGPD are respected.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Documented manual process exists (runbook)
  - Named owner responsible for execution
  - Response within LGPD-mandated timeframe
- **DESIGN.md reference:** Scope IN — processo manual de acesso e exclusão

---

## 2. Operador

### US-OP-01 — Monitor active sessions
**As an** Operador, **I want to** see a real-time list of active conversations **so that** I can identify sessions that need attention.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Dashboard shows sessions with: status, intent, turn count, time active
  - Sessions sortable by time active and turn count
  - Visual indicator for sessions approaching TTL or turn limit
- **Gap:** Not in DESIGN.md — surfaced from workshop "Operador" role

### US-OP-02 — Review lead outputs
**As an** Operador, **I want to** review the structured output from qualification sessions **so that** I can prioritize follow-up actions.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Lead list shows: email, intent, urgency, fit, timestamp, source (origem)
  - Filterable by intent, urgency, date range
  - Export capability (CSV) for CRM integration
- **Gap:** Not in DESIGN.md — surfaced from workshop "Operador" role

### US-OP-03 — Handle escalations
**As an** Operador, **I want to** flag or intervene in problematic sessions **so that** the lead experience is not degraded.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Ability to mark a session for review
  - Ability to add internal notes to a lead record
  - Notification to leadership for systemic issues
- **Gap:** Not in DESIGN.md — surfaced from workshop "Operador" role

### US-OP-04 — View daily metrics
**As an** Operador, **I want to** see daily aggregated counters **so that** I understand today's performance.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Counter dashboard: sessions by intent, email states, valid/excluded sessions
  - Comparison with previous day/week
  - Rate limit and turn-limit exclusion counts visible
- **Gap:** Not in DESIGN.md — counters exist but no operator-facing UI specified

---

## 3. Liderança dos Operadores

### US-LD-01 — Review aggregated performance metrics
**As** Liderança, **I want to** see weekly/monthly performance trends **so that** I can make data-driven decisions about team capacity and process improvements.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Weekly snapshot series: sessions/week, conversion rate, intent distribution
  - Trend visualization (line chart)
  - Drill-down by `origem`, `intencao`, `estado_email`
- **Gap:** Not in DESIGN.md — snapshot exists but no leadership UI specified

### US-LD-02 — Configure routing and operational parameters
**As** Liderança, **I want to** adjust operational parameters (TTL, rate limits, turn limits) **so that** the platform adapts to changing traffic patterns.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Parameters editable via admin interface
  - Changes logged with timestamp and author
  - Changes take effect within 5 minutes
- **Gap:** Not in DESIGN.md — parameters are "provisórios" but no adjustment mechanism specified

### US-LD-03 — Manage operator team
**As** Liderança, **I want to** add, remove, and assign roles to operators **so that** the team scales with demand.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Operator list with role assignments
  - Invite via email
  - Deactivation without data loss
- **Gap:** Not in DESIGN.md — single pilot tenant configured by hand

### US-LD-04 — Approve workflow changes
**As** Liderança, **I want to** approve changes to conversation flows and qualification criteria **so that** the agent behavior aligns with business strategy.
- **Priority:** Could Have
- **Acceptance Criteria:**
  - Change request workflow with approval gate
  - Version history of flow configurations
  - Rollback capability
- **Gap:** Not in DESIGN.md — flow is hardcoded in design

---

## 4. Gestão da Empresa (Tenant)

### US-GE-01 — Evaluate pilot results (go/no-go)
**As** Gestão, **I want to** see a clear go/no-go dashboard with evidence **so that** I can decide whether to invest further.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - R1 evidence: lead adoption rate (sessions → identified leads)
  - R2a evidence: sessions/week trajectory vs 17/week target
  - Classifier accuracy metrics
  - Cost per lead
- **DESIGN.md reference:** Success Criteria — go/no-go framework

### US-GE-02 — Control compliance and data governance
**As** Gestão, **I want to** ensure LGPD compliance and data governance **so that** the company is protected from regulatory risk.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Consent records accessible and auditable
  - Data deletion requests tracked and fulfilled
  - Data retention policy enforced (TTL)
  - Compliance report exportable
- **DESIGN.md reference:** Scope IN — LGPD compliance, consent, runbook

### US-GE-03 — Decide on feature expansion
**As** Gestão, **I want to** see demand signals for additional handlers (agendamento, atendimento, venda) **so that** I can prioritize the next investment.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Intent distribution with confidence intervals
  - Trigger threshold visibility (20% lower bound)
  - Cost-benefit projection for each handler
- **DESIGN.md reference:** Deferred until measured — segundo handler gatilho

---

## 5. Transfer-Related Stories (from workshop notes)

### US-TR-01 — System-initiated transfer (no transfer configured)
**As a** Cliente Final, **I want** the system to gracefully handle the case where no transfer is configured **so that** I'm not left without a path forward.
- **Priority:** Must Have
- **Acceptance Criteria:**
  - Fallback message clearly states no transfer is available
  - Alternative contact channel provided (tenant phone/email)
  - Session remains open for continued conversation
- **Workshop reference:** "Transferido → 1. Não há"

### US-TR-02 — Operator-initiated transfer
**As an** Operador, **I want to** transfer a session to another operator or queue **so that** the lead gets the most appropriate handler.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Transfer button available in session view
  - Transfer reason required (dropdown)
  - Receiving operator notified
  - Lead informed of transfer with context preserved
- **Workshop reference:** "Transferido → 2. Alguém decidiu transferir"

### US-TR-03 — Client-requested transfer
**As a** Cliente Final, **I want to** request to speak with a different person or channel **so that** my specific need is addressed.
- **Priority:** Should Have
- **Acceptance Criteria:**
  - Natural language trigger recognized by agent ("quero falar com outra pessoa", "me transfere")
  - Transfer request logged and routed to operator queue
  - Client informed of expected wait time
- **Workshop reference:** "Transferido → 3. Solicitação do cliente"

---

## 6. Story Priority Summary

| Priority | Count | Actors |
|----------|-------|--------|
| **Must Have** | 9 | CF(5), LD(1), GE(2), TR(1) |
| **Should Have** | 7 | OP(3), LD(2), GE(1), TR(2) |
| **Could Have** | 1 | LD(1) |
| **Won't Have (fatia 1)** | — | See DESIGN.md OUT scope |
