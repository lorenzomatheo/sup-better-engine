"""Backoffice audit — immutable audit log access."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import require_permission
from app.models.audit import AuditLog
from app.models.auth import User

router = APIRouter(prefix="/audit", tags=["backoffice"])


@router.get("/logs")
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    event_type: str | None = None,
    days: int = Query(30, ge=1, le=730),
    user: User = Depends(require_permission("audit.read")),
    db: AsyncSession = Depends(get_db),
):
    """List audit logs with pagination and filters."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    query = select(AuditLog).where(AuditLog.created_at >= cutoff)
    count_query = select(func.count()).select_from(AuditLog).where(
        AuditLog.created_at >= cutoff
    )

    if event_type:
        query = query.where(AuditLog.event_type == event_type)
        count_query = count_query.where(AuditLog.event_type == event_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(AuditLog.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size)
    result = await db.execute(query)
    logs = result.scalars().all()

    items = [
        {
            "log_id": str(log.id),
            "event_type": log.event_type,
            "user_id": str(log.user_id) if log.user_id else None,
            "entity_type": log.entity_type,
            "entity_id": str(log.entity_id) if log.entity_id else None,
            "data": log.data,
            "ip_address": str(log.ip_address) if log.ip_address else None,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "days": days,
    }
