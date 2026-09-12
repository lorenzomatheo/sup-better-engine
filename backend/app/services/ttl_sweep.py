"""TTL background sweep — periodic cleanup of expired sessions and edge counters."""

import asyncio
import logging
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models.counter import CounterBucket, EdgeBlockCounter
from app.models.session import Session
from app.services.counter_service import emit_terminal_counter

logger = logging.getLogger(__name__)

SWEEP_INTERVAL_SECONDS = 300  # 5 minutes


async def sweep_expired_sessions() -> int:
    """Find and process expired sessions, emitting terminal counters.

    Returns the number of sessions processed.
    """
    count = 0
    async with async_session_factory() as session:
        now = datetime.now(timezone.utc)

        # Find sessions that have expired but haven't been terminal-emitted
        result = await session.execute(
            select(Session).where(
                Session.ttl_expiry < now,
                Session.terminal_emitted == False,  # noqa: E712
                Session.valid_session == "valida",
            )
        )
        expired = result.scalars().all()

        for s in expired:
            try:
                # Mark as expired
                await session.execute(
                    update(Session)
                    .where(Session.id == s.id)
                    .values(valid_session="expirada_ttl")
                )
                # Emit terminal counter
                await emit_terminal_counter(session, s)
                count += 1
            except Exception:
                logger.exception("Failed to process expired session %s", s.id)

        if count > 0:
            await session.commit()
            logger.info("TTL sweep: processed %d expired sessions", count)

    return count


async def cleanup_edge_counters() -> int:
    """Remove edge block counter entries older than the rate limit window.

    Returns the number of rows deleted.
    """
    async with async_session_factory() as session:
        cutoff = date.today() - timedelta(days=2)

        result = await session.execute(
            delete(EdgeBlockCounter).where(EdgeBlockCounter.block_date < cutoff)
        )
        deleted = result.rowcount

        if deleted > 0:
            await session.commit()
            logger.info("Edge cleanup: removed %d old entries", deleted)

        return deleted


async def sweep_loop() -> None:
    """Background task: runs TTL sweep and edge cleanup periodically."""
    logger.info("TTL sweep loop started (interval=%ds)", SWEEP_INTERVAL_SECONDS)
    while True:
        try:
            sessions_processed = await sweep_expired_sessions()
            edges_cleaned = await cleanup_edge_counters()

            if sessions_processed or edges_cleaned:
                logger.info(
                    "Sweep complete: %d sessions expired, %d edge entries cleaned",
                    sessions_processed,
                    edges_cleaned,
                )
        except Exception:
            logger.exception("TTL sweep loop error")

        await asyncio.sleep(SWEEP_INTERVAL_SECONDS)
