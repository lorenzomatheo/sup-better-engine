"""Operational parameters model — singleton per tenant."""

import uuid

from sqlalchemy import Integer, Interval
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import CommonMixin, Base


class OperationalParameters(CommonMixin, Base):
    __tablename__ = "operational_parameters"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=False
    )
    session_ttl: Mapped[int] = mapped_column(
        Integer, nullable=False, default=24
    )  # hours
    rate_limit_per_ip_hour: Mapped[int] = mapped_column(
        Integer, nullable=False, default=30
    )
    turn_limit: Mapped[int] = mapped_column(
        Integer, nullable=False, default=40
    )
    email_modal_trigger_turn: Mapped[int] = mapped_column(
        Integer, nullable=False, default=4
    )
    max_email_modal_displays: Mapped[int] = mapped_column(
        Integer, nullable=False, default=2
    )
