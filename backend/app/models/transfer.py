"""Transfer config model — per-tenant transfer settings."""

import uuid

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import CommonMixin, Base


class TransferConfig(CommonMixin, Base):
    __tablename__ = "transfer_configs"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=False
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    mode: Mapped[str] = mapped_column(
        String(20), nullable=False, default="none"
    )  # none | channel
    fallback_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    fallback_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    fallback_email: Mapped[str | None] = mapped_column(String(254), nullable=True)
