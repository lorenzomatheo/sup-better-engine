"""Qualification handler — captures intent, urgency, fit. Triggers email modal."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.classifier import Intent
from app.services.router import RouterResult
from app.services.session_service import get_session, update_session_fields


async def handle_qualification(
    db: AsyncSession,
    session_id: uuid.UUID,
    message: str,
    intent: Intent,
) -> RouterResult:
    """Handle qualification intent messages.

    Captures intent, urgency, and fit through conversation.
    Triggers email modal when all 3 captured OR at turn 4 (whichever first).
    Max 2 email modal displays per session.
    """
    session = await get_session(db, session_id)
    if not session:
        return RouterResult(
            intent=intent,
            handler_name="qualification",
            response_text="Desculpe, ocorreu um erro. Pode tentar novamente?",
        )

    # Build qualification output from conversation context
    qual_output = session.qualification_output or {}

    # Simple state machine: capture fields progressively
    turn = session.turn_count
    if "intent_desc" not in qual_output:
        qual_output["intent_desc"] = message[:200]
        response = "Entendi! Pode me contar mais sobre o que você precisa? E qual a urgência?"
    elif "urgency" not in qual_output:
        qual_output["urgency"] = message[:100]
        response = "Certo. E isso se encaixa bem no que você procura? Me conta um pouco mais."
    elif "fit" not in qual_output:
        qual_output["fit"] = message[:200]
        response = "Perfeito! Tenho uma boa ideia do que você precisa."
    else:
        response = "Obrigado pelas informações! Posso ajudar com mais algo?"

    # Save qualification output
    await update_session_fields(db, session_id, qualification_output=qual_output)

    # Check if email modal should be shown
    show_email = False
    all_captured = all(k in qual_output for k in ("intent_desc", "urgency", "fit"))
    trigger_turn = settings.email_modal_trigger_turn
    max_displays = settings.email_modal_max_displays

    if (all_captured or turn >= trigger_turn) and session.email_modal_displays < max_displays:
        if session.email_state in ("nao_pedido", "pedido_sem_envio"):
            show_email = True
            await update_session_fields(
                db, session_id,
                email_modal_displays=session.email_modal_displays + 1,
                email_state="pedido_sem_envio" if session.email_state == "nao_pedido" else session.email_state,
            )

    return RouterResult(
        intent=intent,
        handler_name="qualification",
        response_text=response,
        show_email_modal=show_email,
    )
