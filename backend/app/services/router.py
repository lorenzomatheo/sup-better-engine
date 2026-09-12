"""Message router — per-message routing per Decision #19.

Routing re-evaluates intent on every message.
Counter aggregation freezes the first non-abstention intent for the session.
"""

import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.classifier import Intent, classify_intent
from app.services.session_service import get_session, update_session_fields


@dataclass
class RouterResult:
    """Result from routing a message."""

    intent: Intent
    handler_name: str  # "qualification", "fallback", "clarification"
    response_text: str
    show_email_modal: bool = False
    metadata: dict | None = None


async def route_message(
    db: AsyncSession,
    session_id: uuid.UUID,
    message: str,
    classifier_mode: str = "stub",
) -> RouterResult:
    """Route a message to the appropriate handler.

    Implements Decision #19:
    - Routing: per-message (re-evaluated every turn)
    - Counter: per-session (first non-abstention intent frozen)
    """
    # 1. Classify the current message
    intent = await classify_intent(message, mode=classifier_mode)

    # 2. Update session's first_intent if not yet set (for counter aggregation)
    session = await get_session(db, session_id)
    if session and session.first_intent is None and intent != Intent.INDEFINIDA:
        await update_session_fields(db, session_id, first_intent=intent.value)

    # 3. Route to handler
    if intent == Intent.QUALIFICACAO:
        from app.handlers.qualification import handle_qualification
        return await handle_qualification(db, session_id, message, intent)

    elif intent in (Intent.ATENDIMENTO, Intent.AGENDAMENTO, Intent.VENDA):
        from app.handlers.fallback import handle_fallback
        return await handle_fallback(db, session_id, message, intent)

    else:  # INDEFINIDA
        return RouterResult(
            intent=intent,
            handler_name="clarification",
            response_text="Entendi! Como posso te ajudar? Estou aqui para ouvir o que você precisa.",
        )
