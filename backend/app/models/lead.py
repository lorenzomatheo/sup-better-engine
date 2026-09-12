"""Lead model — durable, identified by normalized email."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CommonMixin


class Lead(CommonMixin, Base):
    __tablename__ = "leads"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    email_normalized: Mapped[str] = mapped_column(String(254), nullable=False)
    intent: Mapped[str | None] = mapped_column(String(20), nullable=True)
    urgency: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fit: Mapped[str | None] = mapped_column(String(200), nullable=True)
    qualification_output: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    origem: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Consent
    consent_given_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    consent_purpose: Mapped[str] = mapped_column(Text, nullable=False)

    # Dedup / tracking
    session_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="new")

    __table_args__ = (
        UniqueConstraint(
            "tenant_id", "email_normalized", name="uq_leads_tenant_email"
        ),
    )
