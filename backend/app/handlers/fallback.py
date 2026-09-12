"""Fallback handler — graceful response for non-qualification intents.

Turn-terminal, NOT session-terminal. Checks TransferConfig.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transfer import TransferConfig
from app.services.classifier import Intent
from app.services.counter_service import increment_transfer_counter
from app.services.router import RouterResult


async def handle_fallback(
    db: AsyncSession,
    session_id: uuid.UUID,
    message: str,
    intent: Intent,
) -> RouterResult:
    """Handle non-qualification intents with graceful fallback.

    Checks TransferConfig for the tenant.
    If mode = 'none': returns configured fallback message + contact info.
    Turn-terminal, not session-terminal.
    """
    # Get the session to find tenant_id
    from app.services.session_service import get_session
    session = await get_session(db, session_id)
    if not session:
        return RouterResult(
            intent=intent,
            handler_name="fallback",
            response_text="Desculpe, não consegui processar sua mensagem.",
        )

    # Check transfer config
    result = await db.execute(
        select(TransferConfig).where(TransferConfig.tenant_id == session.tenant_id)
    )
    transfer_config = result.scalar_one_or_none()

    # Build fallback response
    if transfer_config and transfer_config.enabled and transfer_config.mode != "none":
        response = (
            transfer_config.fallback_message
            or "Entendi sua solicitação. Vou te encaminhar para nossa equipe."
        )
    else:
        # Default fallback (Trigger 1: "Não há")
        contact_parts = []
        if transfer_config:
            if transfer_config.fallback_phone:
                contact_parts.append(f"telefone {transfer_config.fallback_phone}")
            if transfer_config.fallback_email:
                contact_parts.append(f"email {transfer_config.fallback_email}")

        contact_info = " ou pelo ".join(contact_parts) if contact_parts else "nossos canais de atendimento"

        intent_labels = {
            Intent.ATENDIMENTO: "atendimento",
            Intent.AGENDAMENTO: "agendamento",
            Intent.VENDA: "venda",
        }
        intent_label = intent_labels.get(intent, "solicitação")

        response = (
            f"Entendi que você precisa de {intent_label}. "
            f"No momento, não consigo te ajudar diretamente com isso, "
            f"mas nossa equipe pode te ajudar pelo {contact_info}. "
            f"Posso ajudar com mais alguma coisa?"
        )

    # Increment transfer counter
    await increment_transfer_counter(
        db, session.tenant_id, trigger_type="none", outcome="fallback"
    )

    return RouterResult(
        intent=intent,
        handler_name="fallback",
        response_text=response,
    )
