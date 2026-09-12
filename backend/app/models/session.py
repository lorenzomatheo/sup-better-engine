"""Session model — ephemeral, TTL-based. Anonymous until identified."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CommonMixin


class Session(CommonMixin, Base):
    __tablename__ = "sessions"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    ip_address: Mapped[str] = mapped_column(INET, nullable=False)
    origem: Mapped[str] = mapped_column(
        String(50), nullable=False, default="desconhecido"
    )

    # Counter aggregation: first non-abstention intent (frozen)
    first_intent: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Email state: monotonic 4-value progression
    email_state: Mapped[str] = mapped_column(
        String(20), nullable=False, default="nao_pedido"
    )

    # Session validity
    valid_session: Mapped[str] = mapped_column(
        String(30), nullable=False, default="valida"
    )

    # Conversation tracking
    turn_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    email_modal_displays: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    conversation_context: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict
    )
    qualification_output: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # TTL
    ttl_expiry: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # Terminal emission flag (prevents double-counting)
    terminal_emitted: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    # Flagging / notes (backoffice)
    flagged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Last message timestamp
    last_message_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SessionMessage(CommonMixin, Base):
    """Individual messages within a session."""

    __tablename__ = "session_messages"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    role: Mapped[str] = mapped_column(String(10), nullable=False)  # "user" or "agent"
    content: Mapped[str] = mapped_column(Text, nullable=False)
