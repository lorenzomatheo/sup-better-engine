"""Backoffice sessions — list, detail, flag, notes."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import get_current_user, require_permission
from app.models.audit import AuditLog
from app.models.auth import User
from app.models.session import Session, SessionMessage

router = APIRouter(prefix="/sessions", tags=["backoffice"])


class SessionListResponse(BaseModel):
    items: list[dict]
    total: int
    page: int
    page_size: int


class FlagRequest(BaseModel):
    flagged: bool = True


class NoteRequest(BaseModel):
    note: str


@router.get("")
async def list_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    intent: str | None = None,
    flagged: bool | None = None,
    origem: str | None = None,
    user: User = Depends(require_permission("session.read")),
    db: AsyncSession = Depends(get_db),
):
    """List sessions with pagination and filters."""
    query = select(Session)
    count_query = select(func.count()).select_from(Session)

    if intent:
        query = query.where(Session.first_intent == intent)
        count_query = count_query.where(Session.first_intent == intent)
    if flagged is not None:
        query = query.where(Session.flagged == flagged)
        count_query = count_query.where(Session.flagged == flagged)
    if origem:
        query = query.where(Session.origem == origem)
        count_query = count_query.where(Session.origem == origem)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Session.last_message_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size)
    result = await db.execute(query)
    sessions = result.scalars().all()

    items = []
    for s in sessions:
        ttl_pct = 0
        if s.ttl_expiry:
            elapsed = (datetime.now(timezone.utc) - (s.ttl_expiry - __import__("datetime").timedelta(hours=s.ttl_expiry.hour or 24))).total_seconds()
            ttl_pct = min(100, int((elapsed / max(1, s.ttl_expiry.timestamp())) * 100))

        items.append({
            "session_id": str(s.id),
            "status": "expired" if s.ttl_expiry < datetime.now(timezone.utc) else "active",
            "intent": s.first_intent,
            "turn_count": s.turn_count,
            "origem": s.origem,
            "email_state": s.email_state,
            "last_message_at": s.last_message_at.isoformat() if s.last_message_at else None,
            "flagged": s.flagged,
            "ttl_expiry": s.ttl_expiry.isoformat() if s.ttl_expiry else None,
        })

    return SessionListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{session_id}")
async def get_session_detail(
    session_id: str,
    user: User = Depends(require_permission("session.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get session detail with full transcript."""
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    result = await db.execute(select(Session).where(Session.id == sid))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    msgs_result = await db.execute(
        select(SessionMessage)
        .where(SessionMessage.session_id == sid)
        .order_by(SessionMessage.created_at)
    )
    messages = msgs_result.scalars().all()

    return {
        "session_id": str(session.id),
        "origem": session.origem,
        "intent": session.first_intent,
        "turn_count": session.turn_count,
        "email_state": session.email_state,
        "flagged": session.flagged,
        "internal_notes": session.internal_notes,
        "qualification_output": session.qualification_output,
        "ttl_expiry": session.ttl_expiry.isoformat() if session.ttl_expiry else None,
        "last_message_at": session.last_message_at.isoformat() if session.last_message_at else None,
        "messages": [
            {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat() if m.created_at else None}
            for m in messages
        ],
    }


@router.patch("/{session_id}/flag")
async def flag_session(
    session_id: str,
    body: FlagRequest,
    user: User = Depends(require_permission("session.flag")),
    db: AsyncSession = Depends(get_db),
):
    """Flag or unflag a session for review."""
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    await db.execute(
        update(Session).where(Session.id == sid).values(flagged=body.flagged)
    )

    # Audit log
    audit = AuditLog(
        tenant_id=user.tenant_id,
        user_id=user.id,
        event_type="session.flag" if body.flagged else "session.unflag",
        entity_type="session",
        entity_id=sid,
        data={"flagged": body.flagged},
    )
    db.add(audit)
    await db.commit()

    return {"success": True, "flagged": body.flagged}


@router.post("/{session_id}/notes")
async def add_note(
    session_id: str,
    body: NoteRequest,
    user: User = Depends(require_permission("session.note")),
    db: AsyncSession = Depends(get_db),
):
    """Add an internal note to a session."""
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    result = await db.execute(select(Session).where(Session.id == sid))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    existing = session.internal_notes or ""
    new_notes = f"{existing}\n[{datetime.now(timezone.utc).isoformat()}] {user.name}: {body.note}".strip()

    await db.execute(
        update(Session).where(Session.id == sid).values(internal_notes=new_notes)
    )

    audit = AuditLog(
        tenant_id=user.tenant_id,
        user_id=user.id,
        event_type="session.note",
        entity_type="session",
        entity_id=sid,
    )
    db.add(audit)
    await db.commit()

    return {"success": True}
