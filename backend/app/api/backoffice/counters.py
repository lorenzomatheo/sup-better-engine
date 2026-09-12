"""Backoffice counters — daily, weekly, trends."""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import require_permission
from app.models.auth import User
from app.models.counter import CounterBucket, EdgeBlockCounter, WeeklySnapshot

router = APIRouter(prefix="/counters", tags=["backoffice"])


@router.get("/daily")
async def daily_counters(
    user: User = Depends(require_permission("counter.read")),
    db: AsyncSession = Depends(get_db),
):
    """Today's aggregated counters."""
    today = date.today()

    # Total sessions today (sum of all counter buckets updated today)
    result = await db.execute(
        select(func.sum(CounterBucket.count)).where(
            func.date(CounterBucket.updated_at) == today
        )
    )
    sessions_today = result.scalar() or 0

    # Edge blocks today
    edge_result = await db.execute(
        select(func.sum(EdgeBlockCounter.count)).where(
            EdgeBlockCounter.block_date == today
        )
    )
    edge_blocks_today = edge_result.scalar() or 0

    # Intent distribution today
    intent_result = await db.execute(
        select(CounterBucket.intencao, func.sum(CounterBucket.count))
        .where(func.date(CounterBucket.updated_at) == today)
        .group_by(CounterBucket.intencao)
    )
    intent_distribution = {row[0]: row[1] for row in intent_result.all()}

    # Email state distribution today
    email_result = await db.execute(
        select(CounterBucket.estado_email, func.sum(CounterBucket.count))
        .where(func.date(CounterBucket.updated_at) == today)
        .group_by(CounterBucket.estado_email)
    )
    email_distribution = {row[0]: row[1] for row in email_result.all()}

    return {
        "date": today.isoformat(),
        "sessions_today": sessions_today,
        "edge_blocks_today": edge_blocks_today,
        "intent_distribution": intent_distribution,
        "email_distribution": email_distribution,
    }


@router.get("/weekly")
async def weekly_snapshots(
    weeks: int = Query(12, ge=1, le=52),
    user: User = Depends(require_permission("counter.read")),
    db: AsyncSession = Depends(get_db),
):
    """Weekly snapshot series for trend analysis."""
    cutoff = date.today() - timedelta(weeks=weeks)

    result = await db.execute(
        select(WeeklySnapshot)
        .where(WeeklySnapshot.week_start >= cutoff)
        .order_by(WeeklySnapshot.week_start)
    )
    snapshots = result.scalars().all()

    return {
        "weeks": weeks,
        "data": [
            {
                "week_start": s.week_start.isoformat(),
                "valid_sessions": s.valid_sessions,
            }
            for s in snapshots
        ],
    }


@router.get("/trends")
async def counter_trends(
    user: User = Depends(require_permission("counter.read")),
    db: AsyncSession = Depends(get_db),
):
    """Trend data: bucket aggregation by origem and intencao."""
    result = await db.execute(
        select(
            CounterBucket.origem,
            CounterBucket.intencao,
            func.sum(CounterBucket.count),
        ).group_by(CounterBucket.origem, CounterBucket.intencao)
    )

    trends = []
    for origem, intencao, total in result.all():
        trends.append({
            "origem": origem,
            "intencao": intencao,
            "total": total,
        })

    return {"trends": trends}
