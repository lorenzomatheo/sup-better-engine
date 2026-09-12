"""Counter service — atomic terminal emission into pre-aggregated buckets."""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.counter import CounterBucket, EdgeBlockCounter, TransferCounter, WeeklySnapshot
from app.models.session import Session


async def emit_terminal_counter(
    db: AsyncSession,
    session: Session,
) -> None:
    """Emit a terminal counter for a session.

    Atomic upsert: INSERT ... ON CONFLICT DO UPDATE SET count = count + 1.
    Called on session close or TTL expiry.
    """
    # Determine dimensions
    origem = session.origem or "desconhecido"
    intencao = session.first_intent or "indefinida"
    estado_email = session.email_state or "nao_pedido"
    sessao_valida = session.valid_session or "valida"

    # Atomic upsert via raw SQL (most reliable for composite PK conflict)
    await db.execute(
        text("""
            INSERT INTO counter_buckets (tenant_id, origem, intencao, estado_email, sessao_valida, count, updated_at)
            VALUES (:tenant_id, :origem, :intencao, :estado_email, :sessao_valida, 1, now())
            ON CONFLICT (tenant_id, origem, intencao, estado_email, sessao_valida)
            DO UPDATE SET count = counter_buckets.count + 1, updated_at = now()
        """),
        {
            "tenant_id": str(session.tenant_id),
            "origem": origem,
            "intencao": intencao,
            "estado_email": estado_email,
            "sessao_valida": sessao_valida,
        },
    )

    # Mark session as emitted
    session.terminal_emitted = True
    await db.flush()


async def get_daily_counters(
    db: AsyncSession,
    tenant_id: uuid.UUID,
) -> list[CounterBucket]:
    """Get all counter buckets for a tenant."""
    result = await db.execute(
        select(CounterBucket).where(CounterBucket.tenant_id == tenant_id)
    )
    return list(result.scalars().all())


async def increment_edge_block(
    db: AsyncSession,
    ip_address: str,
) -> None:
    """Increment edge block counter for today."""
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
        db.add(EdgeBlockCounter(ip_address=ip_address, block_date=today, count=1))
    await db.flush()


async def increment_transfer_counter(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    trigger_type: str,
    outcome: str,
) -> None:
    """Increment transfer counter."""
    result = await db.execute(
        select(TransferCounter).where(
            TransferCounter.tenant_id == tenant_id,
            TransferCounter.trigger_type == trigger_type,
            TransferCounter.outcome == outcome,
        )
    )
    counter = result.scalar_one_or_none()
    if counter:
        counter.count += 1
    else:
        db.add(TransferCounter(
            tenant_id=tenant_id,
            trigger_type=trigger_type,
            outcome=outcome,
            count=1,
        ))
    await db.flush()
