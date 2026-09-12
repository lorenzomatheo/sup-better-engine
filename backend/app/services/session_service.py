"""Session service — CRUD, TTL enforcement, turn tracking."""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.session import Session, SessionMessage


async def create_session(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    ip_address: str,
    origem: str = "desconhecido",
) -> Session:
    """Create a new anonymous session with TTL."""
    ttl_hours = settings.session_ttl_hours
    session = Session(
        tenant_id=tenant_id,
        ip_address=ip_address,
        origem=origem,
        ttl_expiry=datetime.now(timezone.utc) + timedelta(hours=ttl_hours),
    )
    db.add(session)
    await db.flush()
    return session


async def get_session(db: AsyncSession, session_id: uuid.UUID) -> Session | None:
    """Retrieve a session by ID."""
    result = await db.execute(select(Session).where(Session.id == session_id))
    return result.scalar_one_or_none()


async def add_message(
    db: AsyncSession,
    session_id: uuid.UUID,
    role: str,
    content: str,
) -> SessionMessage:
    """Add a message to a session and increment turn count."""
    msg = SessionMessage(session_id=session_id, role=role, content=content)
    db.add(msg)

    await db.execute(
        update(Session)
        .where(Session.id == session_id)
        .values(
            turn_count=Session.turn_count + 1,
            last_message_at=datetime.now(timezone.utc),
        )
    )
    await db.flush()
    return msg


async def update_session_fields(
    db: AsyncSession,
    session_id: uuid.UUID,
    **fields,
) -> None:
    """Update specific session fields."""
    await db.execute(
        update(Session).where(Session.id == session_id).values(**fields)
    )
    await db.flush()


def is_session_expired(session: Session) -> bool:
    """Check if a session has exceeded its TTL."""
    return datetime.now(timezone.utc) > session.ttl_expiry


def is_turn_limited(session: Session, limit: int | None = None) -> bool:
    """Check if a session has exceeded its turn limit."""
    max_turns = limit or settings.turn_limit_per_session
    return session.turn_count >= max_turns
