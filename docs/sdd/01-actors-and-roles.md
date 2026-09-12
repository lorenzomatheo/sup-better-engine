# 01 — Actor & Role Model

> **Source:** Handwritten workshop notes (2026-09-12) + DESIGN.md cross-reference.
> **Purpose:** Establish the canonical actor taxonomy for the sup-better-engine platform, reconciling the workshop's role breakdown with the existing design vocabulary.

---

## 1. Actor Taxonomy

### 1.1 Backoffice Actors (Internal — Tenant Side)

| # | Actor | DESIGN.md Equivalent | Responsibility | Access Level |
|---|-------|---------------------|----------------|--------------|
| 1 | **Operador** | *(new — not in DESIGN.md)* | Day-to-day operation: monitors active sessions, reviews lead outputs, handles escalations, manages daily queue. | Operational |
| 2 | **Liderança dos Operadores** | *(new — not in DESIGN.md)* | Team oversight: reviews aggregated metrics, configures routing rules, manages operator schedules/assignments, approves workflow changes. | Supervisory |
| 3 | **Gestão da Empresa** | **Tenant** (DESIGN.md) | Strategic decisions: contract scope, go/no-go on new features, budget, compliance ownership, pilot approval. | Executive |

### 1.2 External Actors

| # | Actor | DESIGN.md Equivalent | Responsibility | Access Level |
|---|-------|---------------------|----------------|--------------|
| 1 | **Cliente Final** | **Lead** (DESIGN.md) | Initiates conversation via link, interacts with agent, provides email for identification. | Public (anonymous until identified) |

### 1.3 System Actors (Implicit — not in notes, required by DESIGN.md)

| # | Actor | Role | Responsibility |
|---|-------|------|----------------|
| 1 | **Agente** | Automated interlocutor | Classifies intent, runs qualification handler or fallback, triggers email collection modal. |
| 2 | **Plataforma** | Infrastructure | Session management, rate limiting, counter aggregation, TTL enforcement, LGPD compliance. |

---

## 2. Actor Relationship Map

```
┌─────────────────────────────────────────────────────┐
│                  TENANT (Empresa)                    │
│                                                     │
│  ┌──────────────┐  ┌──────────────────┐            │
│  │   Gestão      │──│ Liderança dos     │            │
│  │   (Tenant)    │  │    Operadores     │            │
│  └──────────────┘  └────────┬─────────┘            │
│                              │ manages               │
│                     ┌────────▼─────────┐            │
│                     │    Operador       │            │
│                     │  (day-to-day)     │            │
│                     └────────┬─────────┘            │
│                              │ monitors/escals       │
└──────────────────────────────┼──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │     Plataforma       │
                    │  (Agente + Sistema)  │
                    └──────────┬──────────┘
                               │ serves
                    ┌──────────▼──────────┐
                    │   Cliente Final      │
                    │       (Lead)         │
                    └─────────────────────┘
```

---

## 3. Gap: DESIGN.md vs Workshop Notes

| Aspect | DESIGN.md | Workshop Notes | Gap |
|--------|-----------|----------------|-----|
| Tenant granularity | Single "Tenant" role | 3 distinct backoffice roles | **MISSING** — no differentiation of operational vs supervisory vs executive access |
| Lead naming | "Lead" | "Cliente Final" | Terminology only — semantically equivalent |
| Operator workflow | Not addressed | Implied by "Operador" role | **MISSING** — no operator UI/UX specified |
| Leadership oversight | Not addressed | Implied by "Liderança" role | **MISSING** — no metrics dashboard or team management specified |
| Transfer triggers | Not addressed | 3 explicit triggers | **MISSING** — no transfer workflow in DESIGN.md |
| Campaign config | Out of scope | Mentioned as "Questão do Campanha" | **PARTIAL** — campaigns are OUT but configuration context exists |

---

## 4. Access Control Matrix (Proposed)

| Resource | Operador | Liderança | Gestão | Cliente Final |
|----------|:--------:|:---------:|:------:|:-------------:|
| View active sessions | ✅ | ✅ | ❌ | ✅ (own) |
| View lead outputs | ✅ | ✅ | ✅ | ❌ |
| View aggregated counters | ✅ | ✅ | ✅ | ❌ |
| Configure routing rules | ❌ | ✅ | ✅ | ❌ |
| Manage operators | ❌ | ✅ | ✅ | ❌ |
| Contract / billing | ❌ | ❌ | ✅ | ❌ |
| Go/no-go decisions | ❌ | ❌ | ✅ | ❌ |
| Chat with agent | ❌ |  | ❌ | ✅ |

---

## 5. Unstated Requirements Surfaced

1. **Operator onboarding flow** — How does a new operator get access? Who provisions accounts?
2. **Session monitoring UI** — Operators need real-time or near-real-time visibility into active conversations.
3. **Escalation path** — When an operator sees a problematic session, what is the intervention mechanism?
4. **Role-based access control (RBAC)** — The 3-tier backoffice structure implies permission boundaries not yet specified.
5. **Audit trail** — Leadership and Gestão need visibility into operator actions for compliance and accountability.
6. **Notification system** — How are operators alerted to new leads, escalations, or system issues?
