# 05 — Functional Specification: Campaign Configuration

> **Source:** Workshop notes — "Transferido (Configuração / Questão do Campanha)"
> **Purpose:** Define the campaign configuration model that governs how links, attribution, and conversation parameters are set up per campaign or traffic source.

---

## 1. Context & Problem

The workshop notes reference "Questão do Campanha" alongside the transfer configuration, suggesting that campaign-level settings influence both attribution (`?origem=`) and potentially transfer behavior. 

In DESIGN.md, campaigns are explicitly **OUT of scope** ("Disparo de marketing e campanhas — consumidor da identidade, não produtor"). However, the `?origem=` parameter and per-campaign link generation are **IN scope** — creating a configuration surface that needs definition even without full campaign management.

**This document defines the minimum campaign configuration needed for fatia 1, deferring full campaign lifecycle management.**

---

## 2. Campaign Model (Fatia 1 — Minimal)

### 2.1 What "Campaign" Means in Fatia 1

In fatia 1, a "campaign" is not a marketing automation construct. It is a **link configuration** that determines:

1. **Attribution** — the `?origem=` value for counter bucketing
2. **Landing page variant** — which link the client sees (same chat, different entry)
3. **Operational parameters** — optional per-campaign overrides (TTL, turn limit)

### 2.2 Campaign Configuration Schema

```
CampaignConfig {
  id: UUID
  name: string                          # Human-readable name (e.g., "WhatsApp Q3", "Google Ads")
  slug: string                          # URL-safe identifier
  origem_value: string                  # Value for ?origem= parameter (max 50 chars)
  
  # Link generation
  base_url: string                      # Platform landing page URL
  full_url: string                      # base_url + ?origem= + optional tracking
  
  # Optional parameter overrides (inherit from tenant defaults if null)
  ttl_override: duration | null         # Session TTL override
  turn_limit_override: int | null       # Max turns override
  transfer_config_override: TransferConfig | null  # Transfer settings override
  
  # Status
  status: 'active' | 'paused' | 'archived'
  created_at: timestamp
  created_by: UUID                      # User ID (Liderança or Gestão)
  
  # Metrics (pre-aggregated, same bucket structure)
  total_sessions: int
  valid_sessions: int
  leads_identified: int
}
```

### 2.3 Relationship to Tenant

```
Tenant (Gestão)
  └── CampaignConfig[] (1:N)
        ── Session[] (1:N, via origem match)
              └── Lead (0..1, via email identification)
```

In fatia 1 with a single pilot tenant, campaigns are essentially **labeled links** — different URLs for different traffic sources, all pointing to the same platform instance.

---

## 3. Campaign Management UI

### 3.1 Campaign List (Liderança/Gestão)

| Column | Description | Sortable |
|--------|-------------|----------|
| Name | Campaign name | ✅ |
| Origem value | Attribution tag | ✅ |
| Status | Active / Paused / Archived | ✅ |
| Sessions (total) | Counter bucket sum | ✅ |
| Leads | Identified leads from this origem | ✅ |
| Conversion rate | Leads / valid sessions | ✅ |
| Created | Date created | ✅ |

**Actions per row:**
- Copy link (full URL with `?origem=`)
- Pause / Activate
- Archive (soft delete, preserves historical data)
- View metrics (drill-down to counter bucket filtered by this origem)

### 3.2 Campaign Creation Form

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | Text | ✅ | Max 100 chars, unique per tenant |
| Origem value | Text | ✅ | Max 50 chars, alphanumeric + hyphens, unique |
| TTL override | Duration | ❌ | 1h–72h, null = use tenant default |
| Turn limit override | Number | ❌ | 10–100, null = use tenant default |

**On save:**
- Full URL generated and displayed
- Copy-to-clipboard button
- QR code generation (optional, for print materials)

---

## 4. Link & Attribution Flow

### 4.1 URL Structure

```
https://platform.example.com/c/{tenant_slug}?origem={campaign_origem}
```

**Examples:**
- `https://app.supbetter.com/c/acme?origem=whatsapp-q3`
- `https://app.supbetter.com/c/acme?origem=google-ads`
- `https://app.supbetter.com/c/acme?origem=site-banner`
- `https://app.supbetter.com/c/acme` (no origem → `desconhecido`)

### 4.2 Attribution Logic

```
Request received → Extract ?origem= parameter
    → If origem is present and matches a CampaignConfig:
        → Apply campaign parameter overrides (if any)
        → Tag session with campaign origem
    → If origem is present but doesn't match any CampaignConfig:
        → Tag session with origem value as-is (unknown campaign)
        → Log warning for Liderança review
    → If origem is absent:
        → Tag session as 'desconhecido'
        → Use tenant default parameters
```

### 4.3 Counter Bucket Impact

Each campaign's `origem` value maps to the `origem` dimension in the counter bucket:

| Campaign origem | Counter bucket `origem` value |
|-----------------|-------------------------------|
| `whatsapp-q3` | `whatsapp-q3` |
| `google-ads` | `google-ads` |
| `site-banner` | `site-banner` |
| *(none)* | `desconhecido` |
| *(unknown value)* | value as-is (up to 50 chars) |

**Fatia 1 constraint:** The `origem` dimension was designed with 4 values (3 attribution + `desconhecido`). With campaigns, this becomes **N+1** where N = number of active campaigns. 

**Decision:** Keep the bucket dimension as-is. Campaign-specific breakdown is achieved by filtering the bucket by `origem` value, not by adding a separate dimension. The 288-bucket structure holds; `origem` simply has more possible values.

---

## 5. Campaign Lifecycle

### 5.1 States

```
┌─────────┐    create     ┌─────────┐    pause     ┌─────────┐
│  DRAFT  │ ───────────→ │ ACTIVE  │ ────────────→ │ PAUSED  │
└─────────┘               └─────────┘               └─────────┘
                               │                         │
                               │ archive                 │ activate
                               ▼                         ▼
                          ┌─────────┐               ┌─────────┐
                          │ARCHIVED │ ←──────────── │ ACTIVE  │
                          └─────────┘               └─────────
```

| State | Link Active? | Counters Updated? | Editable? |
|-------|:-----------:|:-----------------:|:---------:|
| DRAFT | No | No | ✅ |
| ACTIVE | Yes | Yes | ⚠️ (name only) |
| PAUSED | No | No | ✅ |
| ARCHIVED | No | No (historical preserved) | ❌ |

### 5.2 Rules

- **DRAFT → ACTIVE:** Link becomes valid, sessions start counting under this origem
- **ACTIVE → PAUSED:** Link still resolves but sessions tagged as `origem=pause:{name}` — no, simpler: link returns 404 or redirects to tenant default page. Sessions during pause period are `desconhecido`.
- **ACTIVE/PAUSED → ARCHIVED:** Historical counters preserved, link deactivated permanently
- **Archived campaigns cannot be reactivated** — create a new campaign instead (preserves data integrity)

---

## 6. Integration with Transfer Configuration

The workshop notes link "Transferido" and "Questão do Campanha" together. This suggests campaign-level transfer overrides:

### 6.1 Per-Campaign Transfer Settings

```
CampaignConfig {
  ...
  transfer_config_override: {
    enabled: boolean
    mode: 'none' | 'channel'
    destination: string | null
  }
}
```

**Use case:** A WhatsApp campaign might have transfer enabled (redirect back to WhatsApp), while a Google Ads campaign has transfer disabled (fallback message only).

**Fatia 1 decision:** Defer per-campaign transfer overrides. All campaigns share the tenant-level transfer configuration. This is revisited when Trigger 2/3 transfer workflows are implemented.

---

## 7. Fatia 1 Scope Decision

### Recommended for Fatia 1:
- **CampaignConfig data model:** ✅ Implement — supports `?origem=` attribution
- **Campaign creation UI:** ✅ Implement — simple form, link generation
- **Campaign list with metrics:** ✅ Implement — table view with counter aggregation
- **Link copy/QR generation:** ✅ Implement — operational necessity for tenant

### Deferred to Fatia 2:
- **Per-campaign parameter overrides:** ❌ Adds complexity without pilot evidence
- **Per-campaign transfer overrides:** ❌ Transfer system itself is deferred
- **Campaign pause/archive workflow:** ❌ Single pilot tenant, one or two links max
- **A/B testing between campaigns:** ❌ Requires statistical framework not in scope
- **Campaign scheduling (start/end dates):** ❌ Manual management suffices for pilot

---

## 8. Data Model (Postgres)

```sql
-- Campaign configuration table
CREATE TABLE campaign_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    origem_value VARCHAR(50) NOT NULL,
    base_url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    ttl_override INTERVAL,
    turn_limit_override INT CHECK (turn_limit_override BETWEEN 10 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(tenant_id, origem_value),
    UNIQUE(tenant_id, slug)
);

-- Index for fast origem lookup during session creation
CREATE INDEX idx_campaign_origem ON campaign_configs(tenant_id, origem_value);
CREATE INDEX idx_campaign_status ON campaign_configs(tenant_id, status);
```

---

## 9. Open Questions

1. **Should campaign links be short URLs or full URLs?** — Recommendation: Full URLs with `?origem=` for transparency; short URL service deferred.
2. **Can two campaigns share the same `origem` value?** — Recommendation: No, enforced by unique constraint. Each campaign has a distinct attribution tag.
3. **What happens to sessions if a campaign is paused mid-conversation?** — Recommendation: Existing sessions continue normally; only new sessions are affected. The `origem` is captured at session start, not re-evaluated.
4. **Should campaign metrics be visible to Operador role?** — Recommendation: Yes, as part of the daily metrics dashboard (read-only).
