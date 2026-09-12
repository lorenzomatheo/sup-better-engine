"""Campaign config model — labeled links with ?origem= attribution."""

import uuid

from sqlalchemy import String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CommonMixin


class CampaignConfig(CommonMixin, Base):
    __tablename__ = "campaign_configs"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False)
    origem_value: Mapped[str] = mapped_column(String(50), nullable=False)
    base_url: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active"
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("tenant_id", "origem_value", name="uq_campaign_origem"),
        UniqueConstraint("tenant_id", "slug", name="uq_campaign_slug"),
    )
