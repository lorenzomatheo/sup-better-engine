"""Seed development data: pilot tenant, roles, permissions, gestão user."""

import asyncio
import sys
import uuid
from pathlib import Path

# Ensure app is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory, engine
from app.core.security import hash_password
from app.models.auth import Permission, Role, User, UserRole
from app.models.base import Base
from app.models.campaign import CampaignConfig
from app.models.operational import OperationalParameters
from app.models.tenant import Tenant
from app.models.transfer import TransferConfig

# All permissions per SDD-03 §2.3
ROLE_PERMISSIONS = {
    "operador": [
        "session.read",
        "session.flag",
        "session.note",
        "lead.read",
        "lead.export",
        "counter.read",
    ],
    "lideranca": [
        "session.read",
        "session.flag",
        "session.note",
        "lead.read",
        "lead.export",
        "counter.read",
        "counter.configure",
        "operator.create",
        "operator.update",
        "operator.delete",
        "compliance.read",
        "audit.read",
    ],
    "gestao": [
        "session.read",
        "session.flag",
        "session.note",
        "lead.read",
        "lead.export",
        "counter.read",
        "counter.configure",
        "operator.create",
        "operator.update",
        "operator.delete",
        "tenant.configure",
        "compliance.read",
        "compliance.export",
        "audit.read",
    ],
}


async def seed() -> None:
    """Seed the database with development data."""
    # Create all tables if they don't exist (dev convenience)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # 1. Check if already seeded
        result = await session.execute(select(Tenant).limit(1))
        if result.scalar_one_or_none() is not None:
            print("Database already seeded. Skipping.")
            return

        # 2. Create pilot tenant
        tenant_id = uuid.uuid4()
        tenant = Tenant(id=tenant_id, name="Tenant Piloto", slug="piloto")
        session.add(tenant)
        await session.flush()  # ensure tenant exists before FK references
        print(f"✓ Created tenant: {tenant.name} ({tenant.slug})")

        # 3. Create roles + permissions
        role_ids = {}
        for role_name, perms in ROLE_PERMISSIONS.items():
            role = Role(tenant_id=tenant_id, name=role_name)
            session.add(role)
            await session.flush()  # get role.id
            role_ids[role_name] = role.id

            for perm in perms:
                permission = Permission(role_id=role.id, permission=perm)
                session.add(permission)

            print(f"✓ Created role '{role_name}' with {len(perms)} permissions")

        # 4. Create users (one per role)
        users_data = [
            {"email": "operador@supbetter.com", "name": "Operador Piloto", "role": "operador"},
            {"email": "lideranca@supbetter.com", "name": "Liderança Piloto", "role": "lideranca"},
            {"email": "gestao@supbetter.com", "name": "Gestão Piloto", "role": "gestao"},
        ]

        for user_data in users_data:
            user = User(
                tenant_id=tenant_id,
                email=user_data["email"],
                password_hash=hash_password("pilot2026!"),
                name=user_data["name"],
                is_active=True,
            )
            session.add(user)
            await session.flush()

            user_role = UserRole(user_id=user.id, role_id=role_ids[user_data["role"]])
            session.add(user_role)
            print(f"✓ Created user: {user.email} (role: {user_data['role']})")

        # 5. Create default operational parameters
        op_params = OperationalParameters(
            tenant_id=tenant_id,
            session_ttl=24,
            rate_limit_per_ip_hour=30,
            turn_limit=40,
            email_modal_trigger_turn=4,
            max_email_modal_displays=2,
        )
        session.add(op_params)
        print("✓ Created default operational parameters")

        # 6. Create default transfer config
        transfer_config = TransferConfig(
            tenant_id=tenant_id,
            enabled=False,
            mode="none",
            fallback_message="Entendi sua solicitação. No momento não temos transferência disponível, mas nossa equipe pode te ajudar.",
            fallback_phone="(11) 99999-9999",
            fallback_email="contato@empresa.com.br",
        )
        session.add(transfer_config)
        print("✓ Created default transfer config")

        # 7. Create sample campaign
        campaign = CampaignConfig(
            tenant_id=tenant_id,
            name="WhatsApp Q3",
            slug="whatsapp-q3",
            origem_value="whatsapp-q3",
            base_url="http://localhost:3000/c/piloto",
            status="active",
            created_by=uuid.uuid4(),  # will be updated to real user after flush
        )
        session.add(campaign)
        print("✓ Created sample campaign: WhatsApp Q3")

        await session.commit()
        print("\n✅ Seed complete!")
        print(f"   Login: gestao@supbetter.com / pilot2026!")
        print(f"   Database: sup_better_engine on localhost:5432")


if __name__ == "__main__":
    asyncio.run(seed())
