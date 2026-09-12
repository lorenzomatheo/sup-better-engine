# 06 — Gap Analysis & Cross-Reference Report

> **Purpose:** Systematically compare the workshop notes (handwritten, 2026-09-12) against the existing DESIGN.md to identify coverage gaps, ambiguities, unstated requirements, and unmet needs.
> **Method:** Each element from the workshop notes is mapped to its DESIGN.md counterpart (if any), with gap severity assessed.

---

## 1. Workshop Notes Content (Source Material)

The handwritten notes contain three sections:

### Section A: Atores / Papéis da Plataforma (Backoffice)
1. Operador
2. Liderança dos Operadores
3. Gestão da Empresa

### Section B: Atores Externos
1. Cliente Final

### Section C: Transferido (Configuração / Questão do Campanha)
1. Não há
2. Alguém decidiu transferir
3. Solicitação do cliente

---

## 2. Coverage Matrix

| Workshop Element | DESIGN.md Coverage | Status | Gap Severity | SDD Document |
|-----------------|-------------------|--------|:------------:|--------------|
| **Operador** | Not mentioned | ❌ Missing | **HIGH** | 01, 02, 03 |
| **Liderança dos Operadores** | Not mentioned | ❌ Missing | **HIGH** | 01, 02, 03 |
| **Gestão da Empresa** | "Tenant" (undifferentiated) | ⚠️ Partial | **MEDIUM** | 01, 02, 03 |
| **Cliente Final** | "Lead" (semantically equivalent) | ✅ Covered | — | 01, 02 |
| **Transfer: Não há** | Fallback handler (implicit) | ⚠️ Partial | **LOW** | 04 |
| **Transfer: Alguém decidiu** | Not mentioned | ❌ Missing | **MEDIUM** | 04 |
| **Transfer: Solicitação do cliente** | Not mentioned | ❌ Missing | **MEDIUM** | 04 |
| **Configuração de Campanha** | `?origem=` parameter only | ⚠️ Partial | **MEDIUM** | 05 |

---

## 3. Detailed Gap Analysis

### 3.1 HIGH Severity Gaps

#### Gap 1: No Operator Role Defined
**Impact:** The platform has no specification for the person who actually uses it day-to-day. DESIGN.md focuses on the Lead experience and the Tenant as a monolith, but the workshop clearly identifies an operational layer.

**Unstated Requirements Surfaced:**
- Operator authentication and session management
- Operator dashboard (session monitoring, lead review)
- Operator actions (flag, note, escalate)
- Operator performance metrics

**Risk if Unaddressed:** The pilot tenant cannot operate the platform. There is no user story for the primary internal user.

**Resolution:** SDD-01 (Actor Model), SDD-02 (User Stories US-OP-01 through US-OP-04), SDD-03 (Backoffice Functional Spec).

---

#### Gap 2: No Leadership Role Defined
**Impact:** No specification for team management, parameter configuration, or performance oversight. The DESIGN.md's "Tenant" role is too coarse — it conflates strategic decisions (Gestão) with operational management (Liderança).

**Unstated Requirements Surfaced:**
- Operator CRUD (invite, deactivate, role change)
- Operational parameter configuration UI
- Aggregated metrics dashboard (weekly/monthly trends)
- Approval workflow for configuration changes

**Risk if Unaddressed:** No mechanism to scale beyond a single hand-configured operator. Leadership cannot adjust parameters without code deployment.

**Resolution:** SDD-01 (Actor Model), SDD-02 (User Stories US-LD-01 through US-LD-04), SDD-03 (Backoffice Functional Spec §4).

---

### 3.2 MEDIUM Severity Gaps

#### Gap 3: Tenant Role Not Differentiated
**Impact:** DESIGN.md uses "Tenant" as a single role. The workshop identifies "Gestão da Empresa" as specifically the executive/strategic layer, distinct from operational management.

**Unstated Requirements Surfaced:**
- RBAC with 3 distinct permission levels
- Go/no-go decision panel (Gestão-specific)
- Compliance and data governance oversight (Gestão-specific)
- Contract/billing management (Gestão-specific)

**Resolution:** SDD-01 (Actor Model §1.1, Access Control Matrix), SDD-03 (Backoffice Functional Spec §5).

---

#### Gap 4: Transfer Workflow Not Specified
**Impact:** Three explicit transfer triggers are identified in the workshop but DESIGN.md only addresses Trigger 1 implicitly (fallback message). Triggers 2 and 3 have no specification.

**Unstated Requirements Surfaced:**
- Transfer configuration schema
- Transfer state machine
- Operator-initiated transfer flow
- Client-requested transfer detection
- Transfer counter/metrics
- Integration with existing fallback handler

**Resolution:** SDD-04 (Transfer Workflow — full specification).

---

#### Gap 5: Campaign Configuration Under-Specified
**Impact:** DESIGN.md includes `?origem=` as an attribution parameter but does not define how campaigns are created, managed, or configured. The workshop links campaign configuration to transfer settings.

**Unstated Requirements Surfaced:**
- CampaignConfig data model
- Campaign creation/management UI
- Link generation with attribution
- Per-campaign parameter overrides (deferred)
- Campaign lifecycle states

**Resolution:** SDD-05 (Campaign Configuration — minimal fatia 1 scope).

---

### 3.3 LOW Severity Gaps

#### Gap 6: "Não há" Transfer Not Formalized
**Impact:** The fallback handler exists in DESIGN.md but the "no transfer configured" state is not explicitly named or configured. It's implicit behavior.

**Resolution:** SDD-04 (§3.1) — formalizes the existing fallback as Trigger 1 with explicit configuration.

---

## 4. Ambiguities Identified

### Ambiguity 1: "Liderança dos Operadores" — Team Lead or Department Head?
**Question:** Is "Liderança" a working team lead (senior operator who also handles sessions) or a pure management role?

**Impact:** Affects whether Liderança has `session.read` + `session.flag` permissions or only dashboard/config permissions.

**Recommendation:** Treat as pure management role in fatia 1. If the pilot reveals the need for a working lead, add session permissions in fatia 2.

---

### Ambiguity 2: "Transferido" — Is This a Feature or a Configuration?
**Question:** The workshop places "Transferido" under "Configuração / Questão do Campanha." Is transfer a campaign-level setting or a platform-level feature?

**Impact:** Determines whether transfer config lives in CampaignConfig or TenantConfig.

**Recommendation:** Platform-level feature with campaign-level overrides (deferred to fatia 2). Fatia 1: tenant-level transfer toggle only.

---

### Ambiguity 3: "Questão do Campanha" — Scope Unclear
**Question:** Does "Questão do Campanha" refer to: (a) campaign creation/management, (b) campaign-specific transfer settings, or (c) both?

**Impact:** Determines the scope of SDD-05.

**Recommendation:** Both, but phased. Fatia 1: campaign as labeled link (attribution only). Fatia 2: per-campaign transfer and parameter overrides.

---

### Ambiguity 4: Operator Count — How Many for Pilot?
**Question:** The workshop identifies "Operador" as a role but doesn't specify how many operators the pilot tenant has.

**Impact:** Affects whether operator management UI is needed in fatia 1 or if manual provisioning suffices.

**Recommendation:** Assume 1-3 operators for pilot. Manual provisioning (Liderança creates via admin panel) is sufficient. Self-service onboarding deferred.

---

## 5. Unstated Requirements Summary

These requirements are **not in the workshop notes and not in DESIGN.md** but are logically necessary given the identified actors and workflows:

| # | Requirement | Rationale | Priority |
|---|-------------|-----------|----------|
| 1 | **Authentication system** | 3 backoffice roles need secure login | Must Have |
| 2 | **RBAC engine** | 3 roles with distinct permission sets | Must Have |
| 3 | **Audit logging** | Compliance + accountability for administrative actions | Must Have |
| 4 | **Session monitoring UI** | Operators need visibility into active conversations | Should Have |
| 5 | **Lead export (CSV)** | Operators need to feed leads into external CRM | Should Have |
| 6 | **Notification system** | Operators need alerts for escalations and new leads | Could Have |
| 7 | **Parameter change history** | Leadership needs to track who changed what and when | Should Have |
| 8 | **Compliance report generation** | Gestão needs LGPD evidence for auditors | Must Have |
| 9 | **Campaign link QR generation** | Operational need for print/offline attribution | Could Have |
| 10 | **Transfer queue system** | Required for Trigger 2 execution | Deferred (fatia 2) |

---

## 6. Unmet Needs Assessment

### 6.1 Needs Met by DESIGN.md
- ✅ Lead conversation flow (anonymous → identified)
- ✅ Intent classification and routing
- ✅ Email collection and consent
- ✅ Counter aggregation (privacy-preserving)
- ✅ Rate limiting and abuse protection
- ✅ LGPD compliance foundation
- ✅ Go/no-go framework

### 6.2 Needs Met by Workshop Notes (but not DESIGN.md)
- ✅ Operational role differentiation (3-tier backoffice)
- ✅ Transfer trigger taxonomy (3 explicit triggers)
- ✅ Campaign as configuration concern

### 6.3 Needs Not Met by Either Source
- ❌ **Operator experience design** — What does the operator's daily workflow look like?
- ❌ **Escalation protocols** — When and how does an operator intervene?
- ❌ **Training materials** — How are operators onboarded to the platform?
- ❌ **SLA definitions** — What response times are expected for lead follow-up?
- ❌ **Integration points** — How does lead data flow to the tenant's CRM?
- ❌ **Disaster recovery** — What happens if the platform goes down during a campaign?
- ❌ **Performance benchmarks** — What latency is acceptable for the chat interface?

---

## 7. Recommendations for DESIGN.md Update

The following sections should be added or updated in DESIGN.md to incorporate workshop findings:

### 7.1 Vocabulário — Add
| Termo | Significa |
|-------|-----------|
| **Operador** | Profissional do tenant que monitora sessões e revisa leads no dia a dia |
| **Liderança** | Gestor de equipe do tenant, responsável por configuração operacional e métricas |

### 7.2 Scope IN — Add
- Backoffice com 3 níveis de acesso (Operador, Liderança, Gestão)
- Configuração de campanhas (links com atribuição `?origem=`)
- Sistema de transferência com 3 gatilhos (configuração mínima)

### 7.3 Scope OUT — Clarify
- "Handoff ao vivo" remains OUT, but structured transfer (async, via external channel) is IN as a configuration layer
- "Admin do tenant" is partially IN (backoffice for pilot tenant), fully OUT for multi-tenant self-service

### 7.4 Risks — Add
- **R13 — Adoção operacional:** O tenant piloto pode não ter operadores dedicados, tornando o backoffice subutilizado e invalidando métricas de eficiência operacional.
- **R14 — Complexidade de transferência:** Implementar transferência sem handoff ao vivo pode criar expectativa não atendida no Cliente Final.

---

## 8. SDD Document Index

| Document | Purpose | Workshop Coverage |
|----------|---------|-------------------|
| [01-actors-and-roles.md](01-actors-and-roles.md) | Actor taxonomy & RBAC | Sections A, B |
| [02-user-stories.md](02-user-stories.md) | User stories per actor | All sections |
| [03-functional-spec-backoffice.md](03-functional-spec-backoffice.md) | Backoffice system spec | Sections A |
| [04-transfer-workflow.md](04-transfer-workflow.md) | Transfer system spec | Section C |
| [05-campaign-management.md](05-campaign-management.md) | Campaign configuration | Section C (partial) |
| [06-gap-analysis.md](06-gap-analysis.md) | This document | — |
