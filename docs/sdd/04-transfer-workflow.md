# 04 — Functional Specification: Transfer Workflow

> **Source:** Workshop notes — "Transferido (Configuração / Questão do Campanha)" with 3 explicit triggers.
> **Purpose:** Define the transfer system that handles conversation routing when the agent cannot or should not continue the conversation.

---

## 1. Context & Problem

The workshop notes identify "Transferido" as a distinct configuration concern with three explicit triggers:

1. **Não há** — No transfer path is configured
2. **Alguém decidiu transferir** — An operator or system decision to transfer
3. **Solicitação do cliente** — The client explicitly requests transfer

This is a **gap in DESIGN.md**: the current design specifies a fallback handler that "reconhece o pedido, aponta o contato do tenant e não finge capacidade" but does not define a structured transfer mechanism. The fallback is terminal for the turn but not for the session — however, there is no formal transfer workflow.

---

## 2. Transfer Configuration Model

### 2.1 Configuration Schema

```
TransferConfig {
  enabled: boolean                    # Is transfer active for this tenant?
  mode: 'none' | 'operator' | 'queue' | 'channel'

  # When mode = 'none' (trigger 1: "Não há")
  fallback_message: string            # Message shown when no transfer available
  fallback_contact: {                 # Alternative contact info
    phone: string | null
    email: string | null
    hours: string | null
  }

  # When mode = 'operator' (trigger 2: "Alguém decidiu transferir")
  operator_queue: {
    max_wait_time: duration           # Max time in queue before fallback
    queue_message: string             # "You're being transferred, please wait..."
    timeout_action: 'fallback' | 'voicemail' | 'callback_request'
  }

  # When mode = 'channel' (external channel transfer)
  channel: {
    type: 'whatsapp' | 'phone' | 'email' | 'other'
    destination: string               # Phone number, email, or URL
    context_preservation: boolean     # Send conversation summary?
  }

  # Trigger 3: Client-requested transfer
  client_request: {
    trigger_phrases: string[]         # NLU patterns for transfer requests
    confirmation_required: boolean    # Ask "are you sure?" before transferring
    max_requests_per_session: int     # Prevent transfer loops (default: 2)
  }
}
```

### 2.2 Configuration UI (Liderança/Gestão)

**Transfer Settings Panel:**

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Transfer enabled | Toggle | OFF | Master switch for all transfer functionality |
| Transfer mode | Select | `none` | none / operator / queue / channel |
| Fallback message | Text | "No transfer available. Contact us at [phone/email]." | Shown when mode=none |
| Fallback contact phone | Text | — | Displayed in fallback message |
| Fallback contact email | Text | — | Displayed in fallback message |
| Max queue wait time | Duration | 5 min | Before timeout action triggers |
| Queue timeout action | Select | `fallback` | What happens when queue times out |
| Client transfer phrases | Tags | ["transferir", "falar com humano", "atendente"] | NLU triggers for client-requested transfer |
| Max client transfer requests | Number | 2 | Per session, to prevent loops |

---

## 3. Transfer Triggers & Flows

### 3.1 Trigger 1: "Não há" (No Transfer Configured)

**Condition:** `TransferConfig.enabled = false` OR `TransferConfig.mode = 'none'`

**Flow:**
```
Client message → Agent detects non-qualification intent
    → Fallback handler activates
    → Checks TransferConfig
    → Mode = 'none'
    → Sends fallback_message + fallback_contact
    → Session remains open (turn-terminal, not session-terminal)
    → Counter emitted: intent = fallback, email_state = nao_pedido
```

**Example Message:**
> "Entendi sua solicitação. No momento não temos transferência disponível, mas nossa equipe pode te ajudar pelo telefone (11) 99999-9999 ou pelo email contato@empresa.com.br. Posso ajudar com mais alguma coisa?"

**DESIGN.md Alignment:** This is the current fallback behavior. No change needed — just formalization.

---

### 3.2 Trigger 2: "Alguém decidiu transferir" (Operator/System Decision)

**Condition:** Operator flags session OR system detects escalation pattern

**Sub-triggers:**
| Sub-trigger | Source | Example |
|-------------|--------|---------|
| Operator manual transfer | Operador clicks "Transfer" in dashboard | Session is going poorly, needs human |
| System escalation detection | Platform detects frustration/negative sentiment | Multiple "não estou sendo ajudado" messages |
| Leadership override | Liderança configures auto-transfer for specific intents | All `atendimento` intent → transfer queue |

**Flow (Operator Queue Mode):**
```
Transfer triggered → Session flagged
    → Client receives queue_message
    → Session enters transfer queue
    → Operator receives notification
    → Operator accepts transfer
    → (Fatia 1: no live handoff — see OUT scope)
    → Operator reviews transcript + lead data
    → Operator contacts client via external channel (phone/email)
    → Session marked as "transferred" in backoffice
    → Counter emitted: intent = original, transfer = true
```

**Flow (Channel Transfer Mode):**
```
Transfer triggered → Session flagged
    → Client receives transfer confirmation
    → System sends conversation summary to destination channel
    → Client redirected to external channel (WhatsApp link, phone dial, email compose)
    → Session marked as "transferred_external"
    → Counter emitted: intent = original, transfer = true, channel = destination_type
```

**Data Model Extension:**
```
Session {
  ...existing fields...
  transfer_status: 'none' | 'queued' | 'accepted' | 'completed' | 'timeout' | 'client_abandoned'
  transfer_trigger: 'operator' | 'system' | 'leadership' | 'client'
  transfer_reason: string | null
  transfer_initiated_at: timestamp | null
  transfer_completed_at: timestamp | null
  transfer_destination: string | null  # Operator ID or channel info
}
```

---

### 3.3 Trigger 3: "Solicitação do cliente" (Client-Requested Transfer)

**Condition:** Client message matches transfer trigger phrases

**NLU Detection:**
```
Trigger phrases (configurable):
- "quero falar com outra pessoa"
- "me transfere"
- "quero um atendente"
- "falar com humano"
- "isso não está me ajudando"
- "quero reclamar"

Detection method: Keyword matching (fatia 1) → Intent classifier extension (fatia 2)
```

**Flow:**
```
Client message → Agent detects transfer request phrase
    → If confirmation_required = true:
        → Agent: "Entendi. Você gostaria de ser transferido para nossa equipe? 
                   Isso pode levar alguns minutos."
        → Client confirms or declines
    → If confirmed (or no confirmation required):
        → Check TransferConfig.mode
        → If mode = 'operator': enter queue flow (3.2)
        → If mode = 'channel': enter channel flow (3.2)
        → If mode = 'none': send fallback message (3.1)
    → If client declines confirmation:
        → Agent: "Tudo bem. Como posso ajudar de outra forma?"
        → Session continues normally
```

**Loop Prevention:**
- `client_request.max_requests_per_session` (default: 2)
- After max reached: "Entendi que você gostaria de falar com nossa equipe. 
  Vou registrar seu pedido e eles entrarão em contato pelo email que você 
  forneceu. Posso ajudar com mais alguma coisa enquanto isso?"
- Session flagged for operator follow-up

---

## 4. Transfer State Machine

```
                    ┌─────────────┐
                    │   NORMAL    │
                    │  (active)   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ──────────┐ ┌──────────┐
        │ TRIGGER 1│ │ TRIGGER 2│ │ TRIGGER 3│
        │  (none)  │ │(operator)│ │ (client) │
        └────┬─────┘ └────┬─────┘ └────┬─────
             │            │            │
             ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ FALLBACK │ │  QUEUED  │ │CONFIRM?  │
        │ MESSAGE  │ │          │ │  Yes/No  │
        └────┬─────┘ └────┬───── └────┬─────┘
             │            │       ┌────┴────
             │            │       │         │
             │            │       ▼         ▼
             │            │  ┌──────── ┌────────┐
             │            │  │ QUEUED │ │NORMAL  │
             │            │  │        │ │(resume)│
             │            │  └───┬────┘ └────────┘
             │            │      │
             │            ▼      │
             │       ┌──────────┐│
             │       │TRANSFERRED│
             │       ──────────┘
             ▼
        ┌──────────┐
        │ SESSION  │
        │ CONTINUES│
        │(fallback │
        │ terminal)│
        └──────────┘
```

---

## 5. Integration with DESIGN.md

### 5.1 Impact on Existing Components

| Component | Change Required | Reason |
|-----------|----------------|--------|
| Fallback handler | Extend to check TransferConfig | Current fallback is static; needs dynamic behavior |
| Intent classifier | Add `transfer_request` as sub-intent OR keyword layer | Detect client-requested transfers |
| Session model | Add transfer_status, transfer_trigger, transfer_* fields | Track transfer lifecycle |
| Counter bucket | Add `transfer` dimension (boolean) | Measure transfer volume |
| Rate limiting | No change | Transfer doesn't affect message count |
| TTL | No change | Transferred sessions still expire per TTL |

### 5.2 Counter Bucket Extension

Current dimensions: `origem` (4) × `intencao` (6) × `estado_email` (4) × `sessao_valida` (3) = **288 buckets**

With transfer dimension: + `transferido` (2: `sim`, `nao`) = **576 buckets**

**Decision:** Defer transfer dimension to fatia 2. In fatia 1, transfer events are rare (pilot tenant, no transfer configured by default). Track via separate scalar counter instead:

```
transfer_counter {
  trigger_type: 'none' | 'operator' | 'client'
  outcome: 'completed' | 'timeout' | 'abandoned'
  count: int
}
```

---

## 6. Fatia 1 Scope Decision

### Recommended for Fatia 1:
- **Trigger 1 (Não há):** ✅ Implement — this is the current fallback behavior, just formalized
- **TransferConfig data model:** ✅ Implement — schema ready, even if only `mode=none` is used
- **Transfer UI toggle (Liderança):** ✅ Implement — simple on/off for transfer mode
- **Transfer scalar counter:** ✅ Implement — track transfer attempts separately

### Deferred to Fatia 2:
- **Trigger 2 (Operator transfer):** ❌ Requires live handoff infrastructure (DESIGN.md OUT)
- **Trigger 3 (Client-requested transfer):** ❌ Requires NLU extension + queue system
- **Transfer queue system:** ❌ Requires real-time operator presence (DESIGN.md OUT)
- **Channel transfer (WhatsApp redirect):** ❌ Requires WhatsApp integration (DESIGN.md OUT)

### Rationale:
The workshop notes identify transfer as a configuration concern, not necessarily an active workflow in fatia 1. The minimum viable transfer system is: **know when transfer is needed, log it, and provide a fallback path.** Full transfer execution requires the live handoff subsystem explicitly excluded from fatia 1.

---

## 7. Open Questions

1. **Should transfer requests count toward the turn limit?** — Recommendation: No, transfer is a meta-action, not a conversation turn.
2. **Should transferred sessions be excluded from the "valid session" counter?** — Recommendation: No, a transferred session was still a valid engagement.
3. **What happens to the email consent flow if transfer is triggered before email collection?** — Recommendation: Transfer takes priority; email collection is abandoned for that session.
4. **Should the operator see the full transcript when accepting a transfer?** — Recommendation: Yes, but only until TTL expiry (consistent with session data retention policy).
