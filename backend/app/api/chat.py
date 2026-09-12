"""Chat API — message endpoint with session management, routing, and email submission."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.tenant import Tenant
from app.services.counter_service import emit_terminal_counter
from app.services.email_validator import validate_email
from app.services.lead_service import promote_to_lead
from app.services.rate_limiter import check_rate_limit, increment_edge_block_counter
from app.services.router import route_message
from app.services.session_service import (
    add_message,
    create_session,
    get_session,
    is_session_expired,
    is_turn_limited,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


# --- Request/Response schemas ---

class ChatMessageRequest(BaseModel):
    session_id: str | None = None
    message: str
    origem: str = "desconhecido"


class ChatMessageResponse(BaseModel):
    session_id: str
    response: str
    intent: str
    handler: str
    show_email_modal: bool = False
    turn_count: int


class EmailSubmitRequest(BaseModel):
    session_id: str
    email: str


class EmailSubmitResponse(BaseModel):
    success: bool
    message: str
    lead_id: str | None = None


# --- Helpers ---

async def _get_tenant(db: AsyncSession) -> Tenant:
    """Get the pilot tenant (single tenant in fatia 1)."""
    result = await db.execute(select(Tenant).limit(1))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=500, detail="No tenant configured")
    return tenant


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


# --- Endpoints ---

@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    request: Request,
    body: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a message in a chat session.

    Flow: rate limit → session lookup/create → turn limit → classify → route → respond.
    """
    ip_address = _get_client_ip(request)
    tenant = await _get_tenant(db)

    # 1. Rate limit check
    allowed, remaining = await check_rate_limit(db, ip_address)
    if not allowed:
        await increment_edge_block_counter(db, ip_address)
        raise HTTPException(
            status_code=429,
            detail={"message": "Rate limit exceeded", "retry_after_seconds": 3600},
        )

    # 2. Session lookup or creation
    session = None
    if body.session_id:
        try:
            session = await get_session(db, uuid.UUID(body.session_id))
        except (ValueError, TypeError):
            pass

    if session is None:
        session = await create_session(db, tenant.id, ip_address, body.origem)
    elif is_session_expired(session):
        # Emit terminal counter for expired session, create new one
        await emit_terminal_counter(db, session)
        session = await create_session(db, tenant.id, ip_address, body.origem)
    elif is_turn_limited(session):
        session.valid_session = "excluida_teto"
        await emit_terminal_counter(db, session)
        raise HTTPException(
            status_code=429,
            detail={"message": "Turn limit reached for this session"},
        )

    # 3. Add user message
    await add_message(db, session.id, "user", body.message)

    # 4. Route message (classify + handler)
    result = await route_message(
        db, session.id, body.message, classifier_mode=settings.classifier_mode
    )

    # 5. Add agent response message
    await add_message(db, session.id, "agent", result.response_text)

    # 6. Commit everything
    await db.commit()

    # Refresh session
    session = await get_session(db, session.id)

    return ChatMessageResponse(
        session_id=str(session.id),
        response=result.response_text,
        intent=result.intent.value,
        handler=result.handler_name,
        show_email_modal=result.show_email_modal,
        turn_count=session.turn_count,
    )


@router.post("/email", response_model=EmailSubmitResponse)
async def submit_email(
    body: EmailSubmitRequest,
    db: AsyncSession = Depends(get_db),
):
    """Submit email for lead identification.

    Validates email, promotes session to lead (dedup by normalized email).
    """
    # Validate email
    is_valid, error = validate_email(body.email)
    if not is_valid:
        return EmailSubmitResponse(success=False, message=error)

    # Get session
    try:
        session = await get_session(db, uuid.UUID(body.session_id))
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid session_id")

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Promote to lead
    lead, msg = await promote_to_lead(db, session, body.email)
    await db.commit()

    return EmailSubmitResponse(
        success=True,
        message=msg,
        lead_id=str(lead.id) if lead else None,
    )


@router.get("/session/{session_id}")
async def get_session_state(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get session state (for reconnection)."""
    try:
        session = await get_session(db, uuid.UUID(session_id))
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid session_id")

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": str(session.id),
        "turn_count": session.turn_count,
        "email_state": session.email_state,
        "email_modal_displays": session.email_modal_displays,
        "expired": is_session_expired(session),
        "origem": session.origem,
        "first_intent": session.first_intent,
    }
