"""Backoffice leads — list, detail, export."""

import csv
import io
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import get_current_user, require_permission
from app.models.audit import AuditLog
from app.models.auth import User
from app.models.lead import Lead

router = APIRouter(prefix="/leads", tags=["backoffice"])


class LeadListResponse(BaseModel):
    items: list[dict]
    total: int
    page: int
    page_size: int


@router.get("")
async def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    intent: str | None = None,
    origem: str | None = None,
    status: str | None = None,
    user: User = Depends(require_permission("lead.read")),
    db: AsyncSession = Depends(get_db),
):
    """List leads with pagination and filters."""
    query = select(Lead)
    count_query = select(func.count()).select_from(Lead)

    if intent:
        query = query.where(Lead.intent == intent)
        count_query = count_query.where(Lead.intent == intent)
    if origem:
        query = query.where(Lead.origem == origem)
        count_query = count_query.where(Lead.origem == origem)
    if status:
        query = query.where(Lead.status == status)
        count_query = count_query.where(Lead.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Lead.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size)
    result = await db.execute(query)
    leads = result.scalars().all()

    items = [
        {
            "lead_id": str(l.id),
            "email": l.email_normalized,
            "intent": l.intent,
            "urgency": l.urgency,
            "fit": l.fit,
            "origem": l.origem,
            "status": l.status,
            "session_count": l.session_count,
            "consent_given_at": l.consent_given_at.isoformat() if l.consent_given_at else None,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in leads
    ]

    return LeadListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{lead_id}")
async def get_lead_detail(
    lead_id: str,
    user: User = Depends(require_permission("lead.read")),
    db: AsyncSession = Depends(get_db),
):
    """Get lead detail with qualification output."""
    try:
        lid = uuid.UUID(lead_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lead ID")

    result = await db.execute(select(Lead).where(Lead.id == lid))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    return {
        "lead_id": str(lead.id),
        "email": lead.email_normalized,
        "intent": lead.intent,
        "urgency": lead.urgency,
        "fit": lead.fit,
        "qualification_output": lead.qualification_output,
        "origem": lead.origem,
        "status": lead.status,
        "session_count": lead.session_count,
        "consent_given_at": lead.consent_given_at.isoformat() if lead.consent_given_at else None,
        "consent_purpose": lead.consent_purpose,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
    }


@router.post("/export")
async def export_leads(
    intent: str | None = None,
    origem: str | None = None,
    user: User = Depends(require_permission("lead.export")),
    db: AsyncSession = Depends(get_db),
):
    """Export leads as CSV."""
    query = select(Lead)
    if intent:
        query = query.where(Lead.intent == intent)
    if origem:
        query = query.where(Lead.origem == origem)

    query = query.order_by(Lead.created_at.desc())
    result = await db.execute(query)
    leads = result.scalars().all()

    # Audit log
    audit = AuditLog(
        tenant_id=user.tenant_id,
        user_id=user.id,
        event_type="lead.export",
        data={"count": len(leads), "format": "csv"},
    )
    db.add(audit)
    await db.commit()

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "lead_id", "email", "intent", "urgency", "fit",
        "origem", "status", "session_count", "consent_given_at", "created_at",
    ])
    for l in leads:
        writer.writerow([
            str(l.id), l.email_normalized, l.intent or "", l.urgency or "",
            l.fit or "", l.origem or "", l.status, l.session_count,
            l.consent_given_at.isoformat() if l.consent_given_at else "",
            l.created_at.isoformat() if l.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads_export.csv"},
    )
