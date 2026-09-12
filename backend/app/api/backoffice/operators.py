"""Backoffice operators — CRUD, invite, role management."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import get_current_user, get_user_permissions, require_permission
from app.core.security import hash_password
from app.models.audit import AuditLog
from app.models.auth import Permission, Role, User, UserRole

router = APIRouter(prefix="/operators", tags=["backoffice"])


class InviteRequest(BaseModel):
    email: str
    name: str
    role: str  # "operador" | "lideranca" | "gestao"


class UpdateOperatorRequest(BaseModel):
    is_active: bool | None = None
    role: str | None = None


@router.get("")
async def list_operators(
    user: User = Depends(require_permission("session.read")),
    db: AsyncSession = Depends(get_db),
):
    """List all operators (users) in the tenant."""
    result = await db.execute(
        select(User).where(User.tenant_id == user.tenant_id).order_by(User.name)
    )
    users = result.scalars().all()

    items = []
    for u in users:
        # Get roles for each user
        roles_result = await db.execute(
            select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == u.id)
        )
        roles = [r[0] for r in roles_result.all()]

        items.append({
            "user_id": str(u.id),
            "email": u.email,
            "name": u.name,
            "is_active": u.is_active,
            "roles": roles,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return {"operators": items}


@router.post("/invite")
async def invite_operator(
    body: InviteRequest,
    user: User = Depends(require_permission("operator.create")),
    db: AsyncSession = Depends(get_db),
):
    """Create a new operator with a temporary password."""
    # Check if email already exists
    existing = await db.execute(
        select(User).where(
            User.tenant_id == user.tenant_id,
            User.email == body.email.lower(),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User with this email already exists")

    # Find role
    role_result = await db.execute(
        select(Role).where(
            Role.tenant_id == user.tenant_id,
            Role.name == body.role,
        )
    )
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=400, detail=f"Role '{body.role}' not found")

    # Create user with temporary password
    temp_password = f"temp-{uuid.uuid4().hex[:12]}"
    new_user = User(
        tenant_id=user.tenant_id,
        email=body.email.lower(),
        password_hash=hash_password(temp_password),
        name=body.name,
        is_active=True,
    )
    db.add(new_user)
    await db.flush()

    # Assign role
    user_role = UserRole(user_id=new_user.id, role_id=role.id)
    db.add(user_role)

    # Audit log
    audit = AuditLog(
        tenant_id=user.tenant_id,
        user_id=user.id,
        event_type="operator.create",
        entity_type="user",
        entity_id=new_user.id,
        data={"email": body.email, "role": body.role},
    )
    db.add(audit)
    await db.commit()

    return {
        "success": True,
        "user_id": str(new_user.id),
        "email": new_user.email,
        "temporary_password": temp_password,
        "message": "Operator created. Share the temporary password securely.",
    }


@router.patch("/{user_id}")
async def update_operator(
    user_id: str,
    body: UpdateOperatorRequest,
    current_user: User = Depends(require_permission("operator.update")),
    db: AsyncSession = Depends(get_db),
):
    """Update operator status or role."""
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    result = await db.execute(select(User).where(User.id == uid))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    changes = {}

    if body.is_active is not None:
        changes["is_active"] = body.is_active
        await db.execute(
            update(User).where(User.id == uid).values(is_active=body.is_active)
        )

    if body.role is not None:
        role_result = await db.execute(
            select(Role).where(
                Role.tenant_id == current_user.tenant_id,
                Role.name == body.role,
            )
        )
        new_role = role_result.scalar_one_or_none()
        if not new_role:
            raise HTTPException(status_code=400, detail=f"Role '{body.role}' not found")

        # Remove existing roles and assign new one
        await db.execute(
            UserRole.__table__.delete().where(UserRole.user_id == uid)
        )
        db.add(UserRole(user_id=uid, role_id=new_role.id))
        changes["role"] = body.role

    if changes:
        audit = AuditLog(
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            event_type="operator.update",
            entity_type="user",
            entity_id=uid,
            data=changes,
        )
        db.add(audit)
        await db.commit()

    return {"success": True, "changes": changes}


@router.delete("/{user_id}")
async def deactivate_operator(
    user_id: str,
    current_user: User = Depends(require_permission("operator.delete")),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate an operator (soft delete — preserves audit trail)."""
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    result = await db.execute(select(User).where(User.id == uid))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.execute(
        update(User).where(User.id == uid).values(is_active=False)
    )

    audit = AuditLog(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        event_type="operator.delete",
        entity_type="user",
        entity_id=uid,
        data={"email": target_user.email},
    )
    db.add(audit)
    await db.commit()

    return {"success": True, "deactivated": target_user.email}
