"""Counter models: pre-aggregated buckets, weekly snapshots, edge blocks, transfers."""

import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CommonMixin


class CounterBucket(Base):
    """288 pre-aggregated counter buckets (4 origem × 6 intencao × 4 estado_email × 3 sessao_valida).

    Composite PK enables atomic upsert via INSERT ... ON CONFLICT DO UPDATE.
    """

    __tablename__ = "counter_buckets"

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    origem: Mapped[str] = mapped_column(String(50), primary_key=True)
    intencao: Mapped[str] = mapped_column(String(20), primary_key=True)
    estado_email: Mapped[str] = mapped_column(String(20), primary_key=True)
    sessao_valida: Mapped[str] = mapped_column(String(30), primary_key=True)
    count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class WeeklySnapshot(CommonMixin, Base):
    """Scalar weekly valid sessions count (for R2a tracking)."""

    __tablename__ = "weekly_snapshots"

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    valid_sessions: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)


class EdgeBlockCounter(CommonMixin, Base):
    """Scalar counter: IP-level blocks per day (rate limit rejections at the edge)."""

    __tablename__ = "edge_block_counters"

    ip_address: Mapped[str] = mapped_column(INET, nullable=False)
    block_date: Mapped[date] = mapped_column(Date, nullable=False)
    count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)


class TransferCounter(CommonMixin, Base):
    """Scalar counter: transfer events by trigger_type and outcome."""

    __tablename__ = "transfer_counters"

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    trigger_type: Mapped[str] = mapped_column(String(20), nullable=False)
    outcome: Mapped[str] = mapped_column(String(20), nullable=False)
    count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
