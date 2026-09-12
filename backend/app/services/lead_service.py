"""Lead service — promotion from session, dedup by normalized email."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.models.session import Session
from app.services.email_validator import normalize_email
from app.services.session_service import update_session_fields


async def promote_to_lead(
    db: AsyncSession,
    session: Session,
    email_raw: str,
) -> tuple[Lead | None, str]:
    """Promote a session to a durable lead record.

    Returns:
        (lead, status_message)
    """
    email_normalized = normalize_email(email_raw)
    consent_purpose = (
        "seu e-mail serve para o time comercial do tenant retornar sobre esta conversa"
    )

    # Check if lead already exists (dedup)
    result = await db.execute(
        select(Lead).where(
            Lead.tenant_id == session.tenant_id,
            Lead.email_normalized == email_normalized,
        )
    )
    existing_lead = result.scalar_one_or_none()

    if existing_lead:
        # Increment session count
        existing_lead.session_count += 1
        existing_lead.updated_at = datetime.now(timezone.utc)
        await db.flush()

        # Update session email state
        await update_session_fields(
            db, session.id, email_state="enviado_aceito"
        )

        return existing_lead, "Lead existente atualizado (dedup por e-mail)."

    # Create new lead
    lead = Lead(
        tenant_id=session.tenant_id,
        email_normalized=email_normalized,
        intent=session.first_intent,
        qualification_output=session.qualification_output,
        origem=session.origem,
        consent_given_at=datetime.now(timezone.utc),
        consent_purpose=consent_purpose,
        session_count=1,
    )
    db.add(lead)
    await db.flush()

    # Update session email state
    await update_session_fields(
        db, session.id, email_state="enviado_aceito"
    )

    return lead, "Lead criado com sucesso."
