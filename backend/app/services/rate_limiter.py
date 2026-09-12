"""Rate limiter — IP-based, Postgres-backed (30 msg/IP/hour)."""

import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.counter import EdgeBlockCounter
from app.models.session import Session


async def check_rate_limit(
    db: AsyncSession,
    ip_address: str,
    limit: int | None = None,
) -> tuple[bool, int]:
    """Check if an IP is within the rate limit.

    Returns:
        (allowed: bool, remaining: int)
    """
    max_per_hour = limit or settings.rate_limit_per_ip_per_hour
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)

    result = await db.execute(
        select(func.count()).select_from(Session).where(
            Session.ip_address == ip_address,
            Session.created_at > one_hour_ago,
        )
    )
    current_count = result.scalar() or 0

    remaining = max(0, max_per_hour - current_count)
    return (current_count < max_per_hour, remaining)


async def increment_edge_block_counter(
    db: AsyncSession,
    ip_address: str,
) -> None:
    """Increment the edge block counter for an IP on today's date."""
    today = date.today()

    result = await db.execute(
        select(EdgeBlockCounter).where(
            EdgeBlockCounter.ip_address == ip_address,
            EdgeBlockCounter.block_date == today,
        )
    )
    counter = result.scalar_one_or_none()

    if counter:
        counter.count += 1
    else:
        counter = EdgeBlockCounter(
            ip_address=ip_address,
            block_date=today,
            count=1,
        )
        db.add(counter)

    await db.flush()
