"""Backoffice config — operational parameter management."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import require_permission
from app.models.audit import AuditLog
from app.models.auth import User
from app.models.operational import OperationalParameters

router = APIRouter(prefix="/config", tags=["backoffice"])


class ParameterUpdate(BaseModel):
    session_ttl: int | None = Field(None, ge=1, le=72)
    rate_limit_per_ip_hour: int | None = Field(None, ge=10, le=100)
    turn_limit: int | None = Field(None, ge=10, le=100)
    email_modal_trigger_turn: int | None = Field(None, ge=2, le=10)
    max_email_modal_displays: int | None = Field(None, ge=1, le=5)


@router.get("/parameters")
async def get_parameters(
    user: User = Depends(require_permission("counter.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get current operational parameters."""
    result = await db.execute(
        select(OperationalParameters).limit(1)
    )
    params = result.scalar_one_or_none()
    if not params:
        raise HTTPException(status_code=404, detail="Parameters not configured")

    return {
        "session_ttl": params.session_ttl,
        "rate_limit_per_ip_hour": params.rate_limit_per_ip_hour,
        "turn_limit": params.turn_limit,
        "email_modal_trigger_turn": params.email_modal_trigger_turn,
        "max_email_modal_displays": params.max_email_modal_displays,
    }


@router.patch("/parameters")
async def update_parameters(
    body: ParameterUpdate,
    user: User = Depends(require_permission("counter.configure")),
    db: AsyncSession = Depends(get_db),
):
    """Update operational parameters (Liderança+ only)."""
    result = await db.execute(
        select(OperationalParameters).limit(1)
    )
    params = result.scalar_one_or_none()
    if not params:
        raise HTTPException(status_code=404, detail="Parameters not configured")

    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Audit: capture old values
    old_values = {k: getattr(params, k) for k in updates}

    await db.execute(
        update(OperationalParameters)
        .where(OperationalParameters.id == params.id)
        .values(**updates)
    )

    # Audit log
    audit = AuditLog(
        tenant_id=user.tenant_id,
        user_id=user.id,
        event_type="parameter.change",
        entity_type="operational_parameters",
        entity_id=params.id,
        data={"old": old_values, "new": updates},
    )
    db.add(audit)
    await db.commit()

    return {"success": True, "updated": updates}
