import asyncio
import csv
import io
import json
import logging
import os
import re
import secrets
import smtplib
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import httpx
from fastapi import FastAPI, Depends, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, delete, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from backend.db import (
    Base,
    engine,
    SessionLocal,
    get_db,
    Tenant,
    User,
    Record,
    Contact,
    Reservation,
    AuthSession,
    serialize,
    now,
    uid,
)
from backend.security import (
    password_hash,
    password_verify,
    digest,
    current_user,
    roles,
    rate_limit,
)
from backend.agent import INTENTS, IDENTIFIED, LABELS, classify, answer
from backend.account import router as account_router

log = logging.getLogger("elo")
DEMO = os.getenv("DEMO_MODE", "true").lower() == "true"
PUBLIC_URL = os.getenv("PUBLIC_URL", "http://localhost:5173").rstrip("/")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
FEATURES = [
    {
        "id": "atendimento",
        "name": "Atendimento",
        "description": "Respostas com o contexto da sua empresa. Sem barreiras.",
        "requirements": ["knowledge"],
        "plan": "Essencial",
    },
    {
        "id": "qualificacao",
        "name": "Qualificação de leads",
        "description": "Entenda necessidades, urgência e o perfil de cada oportunidade.",
        "requirements": ["qualification"],
        "plan": "Essencial",
    },
    {
        "id": "agendamento",
        "name": "Agendamentos",
        "description": "Da intenção à reserva confirmada, na mesma conversa.",
        "requirements": ["services"],
        "plan": "Conexão",
    },
    {
        "id": "venda",
        "name": "Venda de catálogo",
        "description": "Transforme descoberta em pedidos com seu catálogo.",
        "requirements": ["products"],
        "plan": "Conexão",
    },
    {
        "id": "resolucao_problemas",
        "name": "Resolução de problemas",
        "description": "Identifique o cliente e acompanhe cada solicitação.",
        "requirements": ["support"],
        "plan": "Completo",
    },
]
DEFAULT_CONFIG = {
    "agent_name": "Elo",
    "description": "Uma conversa pode ser o começo de algo incrível.",
    "tone": "acolhedor e objetivo",
    "enabled": ["atendimento", "qualificacao"],
    "handoff": "client",
    "contact": "Entre em contato com a equipe pelos canais da empresa.",
    "color": "#27634b",
    "published": False,
    "timezone": "America/Sao_Paulo",
    "hours_start": 9,
    "hours_end": 18,
    "weekdays": [0, 1, 2, 3, 4],
}


def records(db, tenant_id, kind):
    return list(
        db.scalars(
            select(Record)
            .where(Record.tenant_id == tenant_id, Record.kind == kind)
            .order_by(Record.created_at.desc())
        )
    )


def get_record(db, record_id, tenant_id, kind=None):
    item = db.get(Record, record_id)
    if not item or item.tenant_id != tenant_id or (kind and item.kind != kind):
        raise HTTPException(404, "Registro não encontrado.")
    return item


def add_record(db, tenant_id, kind, data):
    item = Record(tenant_id=tenant_id, kind=kind, data=data)
    db.add(item)
    db.flush()
    return item


def tenant_for(db, slug):
    tenant = db.scalar(select(Tenant).where(Tenant.slug == slug))
    if not tenant or not tenant.config.get("published"):
        raise HTTPException(404, "Este canal ainda não está publicado.")
    return tenant


def readiness(db, tenant):
    docs = records(db, tenant.id, "knowledge")
    products = records(db, tenant.id, "product")
    services = records(db, tenant.id, "service")
    available = {
        "knowledge": bool(docs),
        "qualification": any(d.data.get("category") == "qualification" for d in docs),
        "support": any(d.data.get("category") == "support" for d in docs),
        "products": any(p.data.get("active", True) for p in products),
        "services": any(s.data.get("active", True) for s in services),
    }
    return [
        {
            **f,
            "enabled": f["id"] in tenant.config.get("enabled", []),
            "ready": all(available[x] for x in f["requirements"]),
            "missing": [x for x in f["requirements"] if not available[x]],
        }
        for f in FEATURES
    ]


def available(db, tenant, intent):
    return any(
        f["id"] == intent and f["enabled"] and f["ready"] for f in readiness(db, tenant)
    )


def pack_chat(chat, admin=False):
    d = {
        k: v
        for k, v in chat.data.items()
        if k not in ("token_hash", "activation_token")
    }
    if not admin:
        d.pop("contact_id", None)
        d.pop("email", None)
    return {
        "id": chat.id,
        **d,
        "created_at": chat.created_at,
        "updated_at": chat.updated_at,
    }


def chat_access(db, request, chat_id):
    chat = db.get(Record, chat_id)
    if (
        not chat
        or chat.kind != "conversation"
        or not secrets.compare_digest(
            chat.data.get("token_hash", ""),
            digest(request.headers.get("X-Chat-Token", "")),
        )
    ):
        raise HTTPException(404, "Conversa não encontrada.")
    if chat.data.get("expires", 0) < time.time():
        raise HTTPException(410, "Esta conversa expirou. Inicie uma nova conversa.")
    tenant = db.get(Tenant, chat.tenant_id)
    if not tenant or not tenant.config.get("published"):
        raise HTTPException(404, "Canal indisponível.")
    return chat, tenant


def add_message(data, content, role="assistant", **extras):
    data["messages"] = [
        *data.get("messages", []),
        {"id": uid(), "role": role, "content": content, "at": now(), **extras},
    ]


def create_invitation(db, tenant, contact, force=False):
    if contact.status == "active" and not force:
        return
    # Reuse a live invitation; do not rotate a token on an unrelated session.
    existing = [
        r
        for r in records(db, tenant.id, "outbox")
        if r.data.get("contact_id") == contact.id
        and r.data.get("expires", 0) > time.time()
        and r.data.get("token_hash")
        and r.data.get("status") in ("pending", "sent", "demo")
    ]
    if existing and not force:
        return
    for previous in existing:
        previous.data = {**previous.data, "token_hash": "", "status": "superseded"}
    token = secrets.token_urlsafe(32)
    link = f"{PUBLIC_URL}/activate?token={token}"
    body = f"Olá, {contact.name}!\n\nSeu atendimento na {tenant.name} foi registrado. Ative sua conta para acompanhar suas solicitações:\n{link}\n\nEste link expira em 24 horas e só pode ser usado uma vez."
    data = {
        "contact_id": contact.id,
        "to": contact.email,
        "subject": f"Ative sua conta · {tenant.name}",
        "body": body,
        "token_hash": digest(token),
        "expires": int(time.time()) + 86400,
        "status": "pending",
        "demo": DEMO,
    }
    item = add_record(db, tenant.id, "outbox", data)
    if os.getenv("SMTP_HOST"):
        try:
            msg = EmailMessage()
            msg["Subject"] = data["subject"]
            msg["From"] = os.getenv("SMTP_FROM", "noreply@example.com")
            msg["To"] = contact.email
            msg.set_content(body)
            with smtplib.SMTP(
                os.environ["SMTP_HOST"], int(os.getenv("SMTP_PORT", "587")), timeout=10
            ) as smtp:
                smtp.starttls()
                if os.getenv("SMTP_USER"):
                    smtp.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
                smtp.send_message(msg)
            item.data = {
                **data,
                "status": "sent",
                "body": "Convite enviado por e-mail.",
            }
        except Exception:
            log.warning("SMTP delivery failed; invitation remains pending")
            item.data = {**data, "status": "failed"}
    elif DEMO:
        item.data = {**data, "status": "demo"}
    else:
        item.data = {**data, "status": "unconfigured"}


def seed_demo(db):
    if not DEMO or db.scalar(select(Tenant).where(Tenant.slug == "studio-aurora")):
        return
    tenant = Tenant(
        slug="studio-aurora",
        name="Studio Aurora",
        config={
            **DEFAULT_CONFIG,
            "agent_name": "Lia",
            "name": "Studio Aurora",
            "description": "Design, estratégia e boas conversas. Vamos criar o próximo capítulo da sua marca?",
            "enabled": [f["id"] for f in FEATURES],
            "published": True,
            "contact": "contato@studioaurora.example",
            "demo": True,
        },
    )
    db.add(tenant)
    db.flush()
    db.add(
        User(
            tenant_id=tenant.id,
            email="demo@elo.local",
            name="Marina Costa",
            role="manager",
            password=password_hash("DemoElo2026!"),
        )
    )
    for title, category, content in [
        (
            "Conheça o Studio Aurora",
            "general",
            "Somos o Studio Aurora, um estúdio de design e estratégia de marca. Ajudamos negócios a encontrar sua identidade e criar experiências memoráveis. Atendemos de segunda a sexta, das 9h às 18h, online para todo o Brasil.",
        ),
        (
            "Horários e atendimento",
            "general",
            "Nosso horário de atendimento é de segunda a sexta, das 9h às 18h (horário de Brasília). As reuniões acontecem online. Você pode agendar uma conversa de descoberta gratuita de 30 minutos.",
        ),
        (
            "Perfil de cliente e qualificação",
            "qualification",
            "Trabalhamos com empreendedores e pequenas empresas que precisam criar ou renovar sua marca. Descubra o objetivo, o momento do negócio e o prazo. Projetos de identidade começam em R$ 2.400. Não solicite dados pessoais durante a qualificação.",
        ),
        (
            "Procedimentos de suporte",
            "support",
            "Para problemas com arquivos: tente baixar novamente pelo link de entrega, descompacte o ZIP e verifique se possui um leitor PDF atualizado. Se não resolver, registre um chamado para a equipe. Prazo de primeira resposta: um dia útil. Não prometa reembolso ou alteração de pedido.",
        ),
        (
            "Processo criativo",
            "general",
            "Nosso processo tem quatro etapas: descoberta, estratégia, criação e entrega. Cada projeto inclui duas rodadas de ajustes. Os prazos são combinados na proposta e começam após aprovação do briefing.",
        ),
    ]:
        add_record(
            db,
            tenant.id,
            "knowledge",
            {
                "title": title,
                "category": category,
                "content": content,
                "source": "manual",
                "status": "ready",
            },
        )
    for name, price, desc, color in [
        (
            "Identidade visual",
            240000,
            "Uma marca com personalidade. Logo, paleta, tipografia e guia de aplicação.",
            "peach",
        ),
        (
            "Landing page",
            180000,
            "Uma página que apresenta seu negócio e transforma visitas em conexões.",
            "lilac",
        ),
        (
            "Consultoria de marca",
            45000,
            "90 minutos para destravar o próximo passo da sua marca.",
            "sage",
        ),
    ]:
        add_record(
            db,
            tenant.id,
            "product",
            {
                "name": name,
                "price": price,
                "description": desc,
                "color": color,
                "active": True,
            },
        )
    for name, duration, price in [
        ("Conversa de descoberta", 30, 0),
        ("Consultoria de marca", 60, 45000),
    ]:
        add_record(
            db,
            tenant.id,
            "service",
            {"name": name, "duration": duration, "price": price, "active": True},
        )
    db.commit()


async def cleanup_loop():
    while True:
        await asyncio.sleep(300)
        with SessionLocal() as db:
            for c in db.scalars(select(Record).where(Record.kind == "conversation")):
                if c.data.get("expires", 0) < time.time():
                    for operation in db.scalars(select(Record).where(Record.tenant_id == c.tenant_id, Record.kind.in_(["appointment", "ticket", "order"]))):
                        if operation.data.get("conversation_id") == c.id:
                            operation.data = {**operation.data, "assignee_id": c.data.get("assignee_id")}
                    # Keep only categorical aggregate, never a per-session archival event.
                    key = {k: c.data.get(k) for k in ("first_intent", "origin")}
                    matches = [
                        x
                        for x in records(db, c.tenant_id, "aggregate")
                        if all(x.data.get(k) == v for k, v in key.items())
                    ]
                    if matches:
                        matches[0].data = {
                            **matches[0].data,
                            "count": matches[0].data["count"] + 1,
                        }
                    else:
                        add_record(db, c.tenant_id, "aggregate", {**key, "count": 1})
                    db.delete(c)
            db.execute(
                delete(AuthSession).where(AuthSession.expires < int(time.time()))
            )
            for kind in ("outbox", "customer_session", "otp"):
                for r in db.scalars(select(Record).where(Record.kind == kind)):
                    if r.data.get("expires", 0) < time.time():
                        db.delete(r)
            db.commit()


@asynccontextmanager
async def lifespan(app):
    if os.getenv("APP_ENV") == "production":
        required = ["DATABASE_URL", "PUBLIC_URL", "ALLOWED_ORIGINS", "OPENAI_API_KEY", "SMTP_HOST", "SMTP_FROM"]
        missing = [key for key in required if not os.getenv(key)]
        if missing:
            raise RuntimeError("Missing production configuration: " + ", ".join(missing))
        if os.getenv("SMTP_USER") and not os.getenv("SMTP_PASSWORD"):
            raise RuntimeError("SMTP_PASSWORD is required when SMTP_USER is configured")
        if DEMO or not COOKIE_SECURE or not PUBLIC_URL.startswith("https://"):
            raise RuntimeError("Production requires DEMO_MODE=false, COOKIE_SECURE=true and HTTPS PUBLIC_URL")
        if not str(engine.url).startswith("postgresql"):
            raise RuntimeError("Production requires PostgreSQL")
        if any(not origin.strip().startswith("https://") for origin in os.environ["ALLOWED_ORIGINS"].split(",")):
            raise RuntimeError("Production requires explicit HTTPS allowed origins")
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_demo(db)
    task = asyncio.create_task(cleanup_loop())
    yield
    task.cancel()


app = FastAPI(title="Elo API", version="1.0.0", lifespan=lifespan)
app.include_router(account_router)
origins = [
    x.strip()
    for x in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if x.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-Chat-Token", "X-Customer-Token"],
)


@app.middleware("http")
async def boundaries(request, call_next):
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        origin = request.headers.get("origin")
        same = str(request.base_url).rstrip("/")
        if origin and origin not in origins and origin not in (PUBLIC_URL, same):
            return Response("Origem não autorizada", 403)
        if int(request.headers.get("content-length", "0") or 0) > 12 * 1024 * 1024:
            return Response("Arquivo muito grande", 413)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    if os.getenv("APP_ENV") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
    response.headers["Permissions-Policy"] = "camera=(), geolocation=(), microphone=(self)"
    if request.url.path.startswith("/api"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    db.execute(select(1))
    return {
        "status": "ok",
        "ai": "openai" if os.getenv("OPENAI_API_KEY") else "local",
        "demo": DEMO,
    }


class Login(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(min_length=1, max_length=200)


class Register(Login):
    email: EmailStr
    password: str = Field(min_length=10, max_length=200)
    name: str = Field(min_length=2, max_length=120)
    company: str = Field(min_length=2, max_length=120)


def login_response(db, user, response):
    raw = secrets.token_urlsafe(32)
    db.add(
        AuthSession(
            token=digest(raw), user_id=user.id, expires=int(time.time()) + 86400 * 7
        )
    )
    db.commit()
    response.set_cookie(
        "elo_session",
        raw,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=86400 * 7,
    )
    return {
        "user": serialize(user),
        "tenant": serialize(db.get(Tenant, user.tenant_id)),
    }


@app.post("/api/auth/login")
def login(
    body: Login, request: Request, response: Response, db: Session = Depends(get_db)
):
    rate_limit("login:" + request.client.host, 20, 300)
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if not user or not password_verify(body.password, user.password):
        raise HTTPException(401, "E-mail ou senha incorretos.")
    return login_response(db, user, response)


@app.post("/api/auth/demo")
def demo_login(response: Response, request: Request, db: Session = Depends(get_db)):
    if not DEMO:
        raise HTTPException(404, "Demonstração desativada.")
    rate_limit("demo:" + request.client.host, 30, 300)
    user = db.scalar(select(User).where(User.email == "demo@elo.local"))
    return login_response(db, user, response)


@app.post("/api/auth/register")
def register(
    body: Register, request: Request, response: Response, db: Session = Depends(get_db)
):
    rate_limit("register:" + request.client.host, 10, 3600)
    email = body.email.strip().lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "Este e-mail já tem uma conta.")
    slug = re.sub(r"[^a-z0-9]+", "-", body.company.lower()).strip("-")[:45] or "empresa"
    if db.scalar(select(Tenant).where(Tenant.slug == slug)):
        slug += "-" + secrets.token_hex(3)
    tenant = Tenant(
        name=body.company, slug=slug, config={**DEFAULT_CONFIG, "name": body.company}
    )
    db.add(tenant)
    db.flush()
    user = User(
        name=body.name,
        email=email,
        password=password_hash(body.password),
        tenant_id=tenant.id,
        role="manager",
    )
    db.add(user)
    db.flush()
    return login_response(db, user, response)


@app.get("/api/auth/me")
def me(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return {
        "user": serialize(user),
        "tenant": serialize(db.get(Tenant, user.tenant_id)),
    }


@app.post("/api/auth/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    db.execute(
        delete(AuthSession).where(
            AuthSession.token == digest(request.cookies.get("elo_session", ""))
        )
    )
    db.commit()
    response.delete_cookie("elo_session")
    return {"ok": True}


class ConfigUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    agent_name: str = Field(min_length=1, max_length=60)
    description: str = Field(max_length=500)
    tone: str = Field(max_length=200)
    enabled: list[
        Literal[
            "atendimento", "qualificacao", "agendamento", "venda", "resolucao_problemas"
        ]
    ]
    handoff: Literal["none", "agent", "client", "both"]
    contact: str = Field(max_length=300)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    published: bool
    timezone: str = "America/Sao_Paulo"
    hours_start: int = Field(default=9, ge=0, le=22)
    hours_end: int = Field(default=18, ge=1, le=23)
    weekdays: list[int] = Field(default=[0, 1, 2, 3, 4], max_length=7)


@app.get("/api/workspace")
def workspace(user: User = Depends(current_user), db: Session = Depends(get_db)):
    tenant = db.get(Tenant, user.tenant_id)
    features = readiness(db, tenant)
    plan = (
        "Completo"
        if "resolucao_problemas" in tenant.config.get("enabled", [])
        else "Conexão"
        if set(tenant.config.get("enabled", [])) & {"venda", "agendamento"}
        else "Essencial"
    )
    return {
        "tenant": serialize(tenant),
        "features": features,
        "plan": plan,
        "ai": "openai" if os.getenv("OPENAI_API_KEY") else "local",
        "email": bool(os.getenv("SMTP_HOST")),
        "demo": DEMO,
    }


@app.patch("/api/workspace")
def update_workspace(
    body: ConfigUpdate,
    user: User = Depends(roles("manager")),
    db: Session = Depends(get_db),
):
    tenant = db.get(Tenant, user.tenant_id)
    try:
        ZoneInfo(body.timezone)
    except Exception:
        raise HTTPException(422, "Fuso horário inválido.")
    if body.hours_start >= body.hours_end or any(
        x not in range(7) for x in body.weekdays
    ):
        raise HTTPException(422, "Horários inválidos.")
    tenant.name = body.name
    tenant.config = {**tenant.config, **body.model_dump()}
    if body.published and (
        not body.enabled
        or any(f["enabled"] and not f["ready"] for f in readiness(db, tenant))
    ):
        raise HTTPException(
            422, "Complete o contexto das funcionalidades ativas antes de publicar."
        )
    db.commit()
    return workspace(user, db)


@app.get("/api/dashboard")
def dashboard(user: User = Depends(current_user), db: Session = Depends(get_db)):
    conversations = records(db, user.tenant_id, "conversation")
    contacts = list(
        db.scalars(select(Contact).where(Contact.tenant_id == user.tenant_id))
    )
    appointments = records(db, user.tenant_id, "appointment")
    tickets = records(db, user.tenant_id, "ticket")
    counts = {
        i: sum(c.data.get("first_intent") == i for c in conversations) for i in INTENTS
    }
    days = []
    for offset in range(6, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=offset)).date().isoformat()
        days.append(
            {
                "date": day,
                "conversations": sum(c.created_at[:10] == day for c in conversations),
            }
        )
    return {
        "total": len(conversations),
        "identified": len(contacts),
        "resolved": sum(c.data.get("status") == "closed" for c in conversations),
        "waiting": sum(c.data.get("status") == "waiting" for c in conversations),
        "appointments": len(appointments),
        "tickets": len(tickets),
        "intents": [
            {"name": LABELS[k], "value": v, "key": k} for k, v in counts.items() if v
        ],
        "timeline": days,
        "recent": [pack_chat(c, True) for c in conversations[:6]],
        "period": "Conversas nas últimas 24 horas; cadastros e operações acumulados.",
    }


CRUD = {"knowledge", "product", "service", "integration"}


class ItemInput(BaseModel):
    data: dict


def validate_item(kind, data):
    if kind == "knowledge":
        if (
            not isinstance(data.get("title"), str)
            or not isinstance(data.get("content"), str)
            or not data["title"].strip()
            or not data["content"].strip()
        ):
            raise HTTPException(422, "Preencha título e conteúdo.")
        if len(str(data.get("content", ""))) > 50000:
            raise HTTPException(422, "Limite de 50 mil caracteres por documento.")
        return {k: data.get(k, "") for k in ("title", "content", "category")} | {
            "source": "manual",
            "status": "ready",
        }
    if kind in ("product", "service"):
        if not str(data.get("name", "")).strip():
            raise HTTPException(422, "Preencha o nome.")
        try:
            price = int(data.get("price", 0))
        except (ValueError, TypeError):
            raise HTTPException(422, "Preço inválido.")
        if not 0 <= price <= 100000000:
            raise HTTPException(422, "Preço inválido.")
        clean = {
            "name": str(data["name"])[:120],
            "price": price,
            "description": str(data.get("description", ""))[:2000],
            "color": data.get("color", "sage"),
            "active": bool(data.get("active", True)),
        }
        if kind == "service":
            try:
                duration = int(data.get("duration", 30))
            except (ValueError, TypeError):
                raise HTTPException(422, "Duração inválida.")
            if duration not in (15, 30, 45, 60, 90, 120):
                raise HTTPException(422, "Duração inválida.")
            clean["duration"] = duration
        return clean
    if kind == "integration":
        endpoint = str(data.get("url", ""))
        if not endpoint.startswith("https://"):
            raise HTTPException(422, "Use uma URL HTTPS.")
        token_env = str(data.get("token_env", ""))[:80]
        if token_env and not re.fullmatch(r"CONNECTOR_[A-Z0-9_]+", token_env):
            raise HTTPException(
                422, "Use uma variável com prefixo CONNECTOR_ e letras maiúsculas."
            )
        return {
            "name": str(data.get("name", "API"))[:120],
            "url": endpoint[:2000],
            "type": data.get("type", "api"),
            "status": "pending",
            "token_env": token_env,
        }
    raise HTTPException(404, "Tipo desconhecido.")


@app.get("/api/items/{kind}")
def list_items(
    kind: str, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    if kind not in CRUD | {"appointment", "ticket", "order", "outbox"}:
        raise HTTPException(404, "Tipo desconhecido.")
    if kind in ("integration", "outbox") and user.role != "manager":
        raise HTTPException(403, "Acesso restrito à gestão.")
    result = []
    for r in records(db, user.tenant_id, kind):
        item = serialize(r)
        if kind == "outbox":
            item.pop("token_hash", None)
            if not DEMO:
                item["body"] = "Conteúdo disponível somente no e-mail do destinatário."
        result.append(item)
    return result


@app.post("/api/items/{kind}")
def create_item(
    kind: str,
    body: ItemInput,
    user: User = Depends(roles("manager")),
    db: Session = Depends(get_db),
):
    if kind not in CRUD:
        raise HTTPException(404, "Tipo desconhecido.")
    item = add_record(db, user.tenant_id, kind, validate_item(kind, body.data))
    db.commit()
    return serialize(item)


@app.patch("/api/items/{kind}/{item_id}")
def update_item(
    kind: str,
    item_id: str,
    body: ItemInput,
    user: User = Depends(roles("manager")),
    db: Session = Depends(get_db),
):
    if kind not in CRUD:
        raise HTTPException(404, "Tipo desconhecido.")
    item = get_record(db, item_id, user.tenant_id, kind)
    item.data = validate_item(kind, body.data)
    db.commit()
    return serialize(item)


@app.delete("/api/items/{kind}/{item_id}")
def delete_item(
    kind: str,
    item_id: str,
    user: User = Depends(roles("manager")),
    db: Session = Depends(get_db),
):
    if kind not in CRUD:
        raise HTTPException(404, "Tipo desconhecido.")
    item = get_record(db, item_id, user.tenant_id, kind)
    db.delete(item)
    db.commit()
    return {"ok": True}


@app.post("/api/knowledge/upload")
async def upload_knowledge(
    file: UploadFile = File(...),
    user: User = Depends(roles("manager")),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith((".txt", ".md", ".csv")):
        raise HTTPException(422, "Envie TXT, Markdown ou CSV.")
    content = await file.read(200001)
    if len(content) > 200000:
        raise HTTPException(413, "Limite de 200 KB por arquivo.")
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(422, "O arquivo deve usar UTF-8.")
    if not text.strip():
        raise HTTPException(422, "O arquivo precisa conter informações para o agente.")
    item = add_record(
        db,
        user.tenant_id,
        "knowledge",
        {
            "title": file.filename[:120],
            "content": text,
            "category": "general",
            "source": "upload",
            "status": "ready",
        },
    )
    db.commit()
    return serialize(item)


@app.post("/api/integrations/{item_id}/sync")
async def sync_integration(
    item_id: str, user: User = Depends(roles("manager")), db: Session = Depends(get_db)
):
    item = get_record(db, item_id, user.tenant_id, "integration")
    host = urlparse(item.data["url"]).hostname
    allowed = [value.strip().lower() for value in os.getenv("INTEGRATION_ALLOWED_HOSTS", "").split(",") if value.strip()]
    if host not in allowed:
        raise HTTPException(
            422,
            "Autorize o domínio em INTEGRATION_ALLOWED_HOSTS no servidor antes de conectar.",
        )
    headers = {}
    token_name = item.data.get("token_env", "")
    if token_name and not token_name.startswith("CONNECTOR_"):
        raise HTTPException(422, "Use uma variável com prefixo CONNECTOR_.")
    if token_name and os.getenv(token_name):
        headers["Authorization"] = "Bearer " + os.environ[token_name]
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=False) as client:
            result = await client.get(item.data["url"], headers=headers)
            result.raise_for_status()
        if len(result.content) > 200000:
            raise ValueError("Payload too large")
        payload = result.json()
        docs = payload.get("documents", [])
        if not isinstance(docs, list) or len(docs) > 30:
            raise ValueError("Invalid documents")
        validated = [validate_item("knowledge", doc) for doc in docs]
        for old in records(db, user.tenant_id, "knowledge"):
            if old.data.get("integration_id") == item.id:
                db.delete(old)
        for clean in validated:
            clean.update(source="integration", integration_id=item.id)
            add_record(db, user.tenant_id, "knowledge", clean)
        item.data = {
            **item.data,
            "status": "connected",
            "last_sync": now(),
            "documents": len(docs),
        }
        db.commit()
        return serialize(item)
    except (httpx.HTTPError, ValueError, AttributeError):
        db.rollback()
        raise HTTPException(
            502,
            "Não foi possível sincronizar. Verifique URL, credencial e formato JSON da integração.",
        )


@app.get("/api/contacts")
def contacts(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return [
        serialize(c)
        for c in db.scalars(
            select(Contact)
            .where(Contact.tenant_id == user.tenant_id)
            .order_by(Contact.created_at.desc())
        )
    ]


@app.get("/api/contacts/export")
def export_contacts(
    user: User = Depends(roles("manager", "leader")), db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Nome", "E-mail", "Status", "Criado em"])

    def safe(v):
        return "'" + v if v.startswith(("=", "+", "-", "@")) else v

    for c in contacts(user, db):
        writer.writerow(
            [safe(str(c[k])) for k in ("name", "email", "status", "created_at")]
        )
    return Response(
        output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contatos.csv"},
    )


@app.get("/api/team")
def team(
    user: User = Depends(roles("manager", "leader")), db: Session = Depends(get_db)
):
    return [
        serialize(u)
        for u in db.scalars(select(User).where(User.tenant_id == user.tenant_id))
    ]


class TeamInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    role: Literal["operator", "leader", "manager"]
    password: str = Field(min_length=10, max_length=200)


@app.post("/api/team")
def add_team(
    body: TeamInput,
    user: User = Depends(roles("manager")),
    db: Session = Depends(get_db),
):
    if db.scalar(select(User).where(User.email == body.email.lower())):
        raise HTTPException(409, "E-mail já cadastrado.")
    member = User(
        tenant_id=user.tenant_id,
        name=body.name,
        email=body.email.lower(),
        role=body.role,
        password=password_hash(body.password),
    )
    db.add(member)
    db.commit()
    return serialize(member)


@app.delete("/api/team/{member_id}")
def remove_team(
    member_id: str,
    user: User = Depends(roles("manager")),
    db: Session = Depends(get_db),
):
    member = db.get(User, member_id)
    if not member or member.tenant_id != user.tenant_id:
        raise HTTPException(404, "Pessoa não encontrada.")
    if member.id == user.id:
        raise HTTPException(422, "Você não pode remover seu próprio acesso.")
    db.execute(delete(AuthSession).where(AuthSession.user_id == member.id))
    db.delete(member)
    db.commit()
    return {"ok": True}


@app.get("/api/conversations")
def conversations(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return [pack_chat(c, True) for c in records(db, user.tenant_id, "conversation")]


class ConversationAction(BaseModel):
    action: Literal["claim", "release", "close", "reply", "assign"]
    content: str = Field(default="", max_length=4000)
    assignee_id: str | None = None


@app.post("/api/conversations/{chat_id}/action")
def conversation_action(
    chat_id: str,
    body: ConversationAction,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    chat = get_record(db, chat_id, user.tenant_id, "conversation")
    d = dict(chat.data)
    if body.action == "claim":
        if d.get("assignee_id") not in (None, user.id) and user.role == "operator":
            raise HTTPException(403, "Conversa atribuída a outra pessoa.")
        d.update(
            status="human",
            assignee_id=user.id,
            assignee_name=user.name,
            needs_identity=False,
        )
        add_message(d, f"{user.name} entrou na conversa.", "system")
    elif body.action == "assign":
        if user.role not in ("manager", "leader"):
            raise HTTPException(403, "Somente a liderança pode distribuir conversas.")
        member = db.get(User, body.assignee_id)
        if not member or member.tenant_id != user.tenant_id:
            raise HTTPException(422, "Operador inválido.")
        d.update(
            status="human",
            assignee_id=member.id,
            assignee_name=member.name,
            needs_identity=False,
        )
    else:
        if user.role == "operator" and d.get("assignee_id") != user.id:
            raise HTTPException(403, "Assuma a conversa antes de responder.")
        if body.action == "reply":
            if d.get("status") != "human":
                raise HTTPException(409, "Assuma a conversa antes de responder.")
            if not body.content.strip():
                raise HTTPException(422, "Escreva uma mensagem.")
            add_message(d, body.content.strip(), "operator", author=user.name)
        elif body.action == "release":
            d.update(status="active", assignee_id=None, assignee_name=None)
            add_message(d, "O atendimento voltou para o assistente virtual.", "system")
        elif body.action == "close":
            d.update(status="closed", needs_identity=False)
            add_message(
                d,
                "Atendimento finalizado pela equipe. Obrigado pela conversa!",
                "system",
            )
            if d.get("contact_id"):
                create_invitation(
                    db, db.get(Tenant, user.tenant_id), db.get(Contact, d["contact_id"])
                )
    for operation in db.scalars(select(Record).where(Record.tenant_id == user.tenant_id, Record.kind.in_(["appointment", "ticket", "order"]))):
        if operation.data.get("conversation_id") == chat.id:
            operation.data = {**operation.data, "assignee_id": d.get("assignee_id")}
    chat.data = d
    db.commit()
    return pack_chat(chat, True)


@app.get("/api/public/{slug}")
def public_tenant(slug: str, db: Session = Depends(get_db)):
    t = tenant_for(db, slug)
    return {
        "name": t.name,
        "slug": t.slug,
        "agent_name": t.config.get("agent_name", "Elo"),
        "description": t.config.get("description", ""),
        "color": t.config.get("color", "#27634b"),
        "features": [f["id"] for f in readiness(db, t) if f["enabled"] and f["ready"]],
        "demo": bool(t.config.get("demo")),
        "ai": bool(os.getenv("OPENAI_API_KEY")),
        "audio": bool(os.getenv("OPENAI_API_KEY")),
    }


class StartChat(BaseModel):
    origin: str = Field(default="site", max_length=40)


@app.post("/api/public/{slug}/sessions")
def start_chat(
    slug: str, body: StartChat, request: Request, db: Session = Depends(get_db)
):
    rate_limit("session:" + request.client.host, 50, 3600)
    t = tenant_for(db, slug)
    raw = secrets.token_urlsafe(32)
    d = {
        "token_hash": digest(raw),
        "status": "active",
        "intent": "indefinida",
        "first_intent": "nenhuma",
        "origin": body.origin
        if body.origin in ("site", "whatsapp", "busca")
        else "desconhecido",
        "identified": False,
        "needs_identity": False,
        "identity_requests": 0,
        "messages": [],
        "expires": int(time.time()) + 86400,
        "engine": "openai" if os.getenv("OPENAI_API_KEY") else "local",
    }
    add_message(
        d,
        f"Olá! Sou {t.config.get('agent_name', 'Elo')}, assistente da {t.name}. Estou aqui para ajudar. O que te traz por aqui hoje?",
    )
    c = add_record(db, t.id, "conversation", d)
    db.commit()
    return {"conversation": pack_chat(c), "token": raw}


@app.get("/api/chat/{chat_id}")
def get_chat(chat_id: str, request: Request, db: Session = Depends(get_db)):
    c, _ = chat_access(db, request, chat_id)
    return pack_chat(c)


class ChatMessage(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    request_id: str = Field(min_length=8, max_length=80)


# Single-worker locking plus idempotency protects duplicate messages in the hackathon deployment.
chat_locks: dict[str, asyncio.Lock] = {}


def ensure_not_processing(chat):
    if chat_locks.get(chat.id) and chat_locks[chat.id].locked():
        raise HTTPException(
            409, "Aguarde a resposta do agente antes de continuar esta ação."
        )


@app.post("/api/chat/{chat_id}/messages")
async def message(
    chat_id: str, body: ChatMessage, request: Request, db: Session = Depends(get_db)
):
    c, t = chat_access(db, request, chat_id)
    rate_limit("message:" + request.client.host, 120, 3600)
    if len(chat_locks) > 10000:
        chat_locks.clear()
    async with chat_locks.setdefault(chat_id, asyncio.Lock()):
        db.refresh(c)
        d = dict(c.data)
        if body.request_id in d.get("requests", []):
            return pack_chat(c)
        if d.get("status") == "closed":
            raise HTTPException(409, "Conversa encerrada. Inicie uma nova conversa.")
        if sum(m["role"] == "user" for m in d["messages"]) >= 80:
            raise HTTPException(429, "Limite de mensagens desta conversa atingido.")
        add_message(d, body.content, "user")
        d["requests"] = [*d.get("requests", []), body.request_id][-80:]
        if d.get("status") in ("human", "waiting"):
            c.data = d
            db.commit()
            return pack_chat(c)
        result, provider = await classify(body.content, d)
        intent = result.intent
        d.update(intent=intent, engine=provider, needs_identity=False, action=None)
        if d.get("first_intent") in ("nenhuma", "indefinida"):
            d["first_intent"] = intent
        handoff = t.config.get("handoff", "none")
        if result.wants_human and handoff in ("client", "both"):
            d.update(status="waiting", needs_identity=False)
            add_message(
                d,
                "Encaminhei sua conversa para a fila da equipe. Ainda não há um operador nesta conversa; você pode deixar sua mensagem por aqui.",
            )
        elif result.wants_human:
            add_message(
                d,
                "A transferência por solicitação não está disponível neste canal. "
                + t.config.get("contact", ""),
            )
        elif intent == "indefinida":
            text, eng, _ = await answer(
                body.content, d["messages"], {**t.config, "name": t.name}, [], intent
            )
            add_message(d, text)
            d["engine"] = eng
        elif not available(db, t, intent):
            add_message(
                d,
                f"{LABELS[intent]} ainda não está disponível neste canal. "
                + t.config.get("contact", "")
                + " Posso ajudar com outra dúvida?",
            )
        elif intent in IDENTIFIED and not d.get("identified"):
            if d.get("identity_requests", 0) >= 2:
                add_message(
                    d,
                    "Para continuar essa solicitação, preciso da identificação. Você pode usar o botão “Continuar solicitação” ou seguir tirando dúvidas sem cadastro.",
                )
                d["can_identify"] = True
            else:
                d.update(
                    needs_identity=True,
                    identity_requests=d.get("identity_requests", 0) + 1,
                    can_identify=True,
                )
                add_message(
                    d,
                    "Para "
                    + (
                        "agendar"
                        if intent == "agendamento"
                        else "registrar e acompanhar seu problema"
                    )
                    + ", preciso identificar você. Preencha seu nome e e-mail no formulário abaixo. Para tirar dúvidas, você pode continuar sem cadastro.",
                )
        elif intent == "agendamento":
            d["action"] = "schedule"
            add_message(
                d,
                "Vamos encontrar um horário. Escolha o serviço, o dia e um dos horários disponíveis abaixo.",
            )
        elif intent == "resolucao_problemas":
            d["action"] = "support"
            docs = [
                r.data
                for r in records(db, t.id, "knowledge")
                if r.data.get("category") == "support"
            ]
            content = (
                docs[0]["content"]
                if docs
                else "Descreva o que aconteceu para registrarmos sua solicitação."
            )
            add_message(
                d,
                content
                + "\n\nSe precisar da equipe, registre um chamado abaixo para acompanhar a resolução.",
            )
        elif intent == "venda":
            d["action"] = "catalog"
            add_message(
                d,
                "Aqui está nosso catálogo. Você pode ver os detalhes e adicionar itens ao pedido, sem precisar se cadastrar.",
            )
        else:
            docs = [
                r.data
                for r in records(db, t.id, "knowledge")
                if r.data.get("category") != "support"
            ]
            content, eng, needs_human = await answer(
                body.content, d["messages"], {**t.config, "name": t.name}, docs, intent
            )
            d["engine"] = eng
            add_message(d, content)
            if needs_human and handoff in ("agent", "both"):
                d["status"] = "waiting"
                add_message(
                    d,
                    "Vou deixar essa dúvida na fila da equipe. Você será atendido aqui quando um operador assumir.",
                )
        db.refresh(c)
        latest = dict(c.data)
        if latest.get("status") in ("human", "waiting", "closed"):
            if body.request_id not in latest.get("requests", []):
                add_message(latest, body.content, "user")
                latest["requests"] = [*latest.get("requests", []), body.request_id][
                    -80:
                ]
            d = latest
        c.data = d
        db.commit()
        return pack_chat(c)


class Identity(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    consent: bool


@app.post("/api/chat/{chat_id}/identify")
def identify(
    chat_id: str, body: Identity, request: Request, db: Session = Depends(get_db)
):
    c, t = chat_access(db, request, chat_id)
    ensure_not_processing(c)
    d = dict(c.data)
    if (
        d.get("status") != "active"
        or d.get("intent") not in IDENTIFIED
        or not available(db, t, d["intent"])
    ):
        raise HTTPException(409, "Esta intenção não solicita identificação.")
    if not body.consent:
        raise HTTPException(422, "Confirme a finalidade para continuar.")
    email = str(body.email).strip().lower()
    if email.rsplit("@", 1)[1] in {
        "mailinator.com",
        "tempmail.com",
        "guerrillamail.com",
        "10minutemail.com",
    }:
        raise HTTPException(
            422, "Use um e-mail permanente para acompanhar sua solicitação."
        )
    if d.get("identified"):
        return pack_chat(c)
    contact = db.scalar(
        select(Contact).where(Contact.tenant_id == t.id, Contact.email == email)
    )
    if not contact:
        contact = Contact(
            tenant_id=t.id,
            email=email,
            name=body.name,
            consent=f"{now()}: identificação para {d['intent']}, acompanhamento e convite de ativação. v1",
        )
        db.add(contact)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            contact = db.scalar(
                select(Contact).where(Contact.tenant_id == t.id, Contact.email == email)
            )
    d.update(
        identified=True,
        contact_id=contact.id,
        name=body.name,
        email=email,
        needs_identity=False,
        can_identify=False,
        action="schedule" if d["intent"] == "agendamento" else "support",
    )
    add_message(
        d,
        f"Obrigado, {body.name.split()[0]}! "
        + (
            "Escolha o serviço e um horário disponível para confirmar seu agendamento."
            if d["intent"] == "agendamento"
            else "Conte o que aconteceu no formulário abaixo. Vamos registrar seu problema para acompanhamento."
        ),
    )
    c.data = d
    db.commit()
    return pack_chat(c)


@app.post("/api/chat/{chat_id}/skip-identification")
def skip_identify(chat_id: str, request: Request, db: Session = Depends(get_db)):
    c, t = chat_access(db, request, chat_id)
    d = dict(c.data)
    d.update(
        needs_identity=False, action=None, can_identify=d.get("intent") in IDENTIFIED
    )
    add_message(
        d,
        "Tudo bem! Você pode continuar tirando dúvidas sem se identificar. A solicitação não foi executada.",
    )
    c.data = d
    db.commit()
    return pack_chat(c)


@app.post("/api/chat/{chat_id}/close")
def close_chat(chat_id: str, request: Request, db: Session = Depends(get_db)):
    c, t = chat_access(db, request, chat_id)
    d = dict(c.data)
    if d.get("status") == "closed":
        return pack_chat(c)
    d.update(status="closed", needs_identity=False, action=None)
    add_message(d, "Obrigado pela conversa! Até a próxima.")
    if d.get("contact_id"):
        create_invitation(db, t, db.get(Contact, d["contact_id"]))
        add_message(
            d,
            "Sua solicitação fica registrada. "
            + (
                "O convite de ativação estará no e-mail informado."
                if os.getenv("SMTP_HOST")
                else "O envio de convite depende da configuração de e-mail da empresa."
            ),
        )
    c.data = d
    db.commit()
    return pack_chat(c)


@app.post("/api/chat/{chat_id}/audio")
async def transcribe(
    chat_id: str,
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    chat_access(db, request, chat_id)
    rate_limit("audio:" + request.client.host, 20, 3600)
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(503, "Áudio disponível após configurar a OpenAI.")
    content = await file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "Áudio deve ter no máximo 10 MB.")
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            r = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": "Bearer " + os.environ["OPENAI_API_KEY"]},
                data={
                    "model": os.getenv(
                        "OPENAI_TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe"
                    ),
                    "language": "pt",
                },
                files={
                    "file": (
                        file.filename or "audio.webm",
                        content,
                        file.content_type or "audio/webm",
                    )
                },
            )
            r.raise_for_status()
        return {"text": r.json()["text"]}
    except (httpx.HTTPError, KeyError):
        raise HTTPException(
            502, "Não foi possível transcrever o áudio. Tente novamente ou envie texto."
        )


@app.get("/api/public/{slug}/catalog")
def public_catalog(slug: str, db: Session = Depends(get_db)):
    t = tenant_for(db, slug)
    if not available(db, t, "venda"):
        return []
    return [
        serialize(r) for r in records(db, t.id, "product") if r.data.get("active", True)
    ]


@app.get("/api/public/{slug}/services")
def public_services(slug: str, db: Session = Depends(get_db)):
    t = tenant_for(db, slug)
    if not available(db, t, "agendamento"):
        return []
    return [
        serialize(r) for r in records(db, t.id, "service") if r.data.get("active", True)
    ]


def slots_for(db, t, service, day):
    try:
        date = datetime.strptime(day, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(422, "Data inválida.")
    tz = ZoneInfo(t.config.get("timezone", "America/Sao_Paulo"))
    current = datetime.now(tz)
    if (
        date < current.date()
        or date > current.date() + timedelta(days=60)
        or date.weekday() not in t.config.get("weekdays", [0, 1, 2, 3, 4])
    ):
        return []
    used = {
        r.slot
        for r in db.scalars(select(Reservation).where(Reservation.tenant_id == t.id))
    }
    duration = service.data.get("duration", 30)
    start = t.config.get("hours_start", 9) * 60
    end = t.config.get("hours_end", 18) * 60
    out = []
    for minute in range(start, end - duration + 1, 15):
        dt = datetime(
            date.year, date.month, date.day, minute // 60, minute % 60, tzinfo=tz
        )
        blocks = [
            (dt + timedelta(minutes=n)).isoformat() for n in range(0, duration, 15)
        ]
        if dt > current and not any(x in used for x in blocks):
            out.append(dt.isoformat())
    return out


@app.get("/api/public/{slug}/slots")
def public_slots(slug: str, service_id: str, day: str, db: Session = Depends(get_db)):
    t = tenant_for(db, slug)
    if not available(db, t, "agendamento"):
        raise HTTPException(409, "Agenda indisponível.")
    service = get_record(db, service_id, t.id, "service")
    return slots_for(db, t, service, day)


class Booking(BaseModel):
    service_id: str
    start: str
    request_id: str = Field(min_length=8, max_length=80)


@app.post("/api/chat/{chat_id}/book")
def book(chat_id: str, body: Booking, request: Request, db: Session = Depends(get_db)):
    c, t = chat_access(db, request, chat_id)
    ensure_not_processing(c)
    d = dict(c.data)
    if (
        d.get("status") != "active"
        or d.get("intent") != "agendamento"
        or not d.get("identified")
        or not available(db, t, "agendamento")
    ):
        raise HTTPException(
            409, "Identifique-se na jornada de agendamento antes de reservar."
        )
    existing = [
        x
        for x in records(db, t.id, "appointment")
        if x.data.get("request_id") == body.request_id
        and x.data.get("conversation_id") == c.id
    ]
    if existing:
        return serialize(existing[0])
    service = get_record(db, body.service_id, t.id, "service")
    if not service.data.get("active", True) or body.start not in slots_for(
        db, t, service, body.start[:10]
    ):
        raise HTTPException(
            409, "Esse horário não está mais disponível. Escolha outro."
        )
    appointment = add_record(
        db,
        t.id,
        "appointment",
        {
            "service_id": service.id,
            "service": service.data["name"],
            "start": body.start,
            "duration": service.data["duration"],
            "contact_id": d["contact_id"],
            "name": d["name"],
            "email": d["email"],
            "status": "confirmed",
            "conversation_id": c.id,
            "assignee_id": d.get("assignee_id"),
            "request_id": body.request_id,
        },
    )
    dt = datetime.fromisoformat(body.start)
    for minutes in range(0, service.data["duration"], 15):
        db.add(
            Reservation(
                tenant_id=t.id,
                slot=(dt + timedelta(minutes=minutes)).isoformat(),
                record_id=appointment.id,
            )
        )
    add_message(
        d,
        f"Agendamento confirmado: {service.data['name']}, {dt.strftime('%d/%m às %H:%M')}. Você pode baixar o convite de calendário abaixo.",
        appointment_id=appointment.id,
    )
    d["action"] = None
    c.data = d
    create_invitation(db, t, db.get(Contact, d["contact_id"]))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Esse horário acabou de ser reservado. Escolha outro.")
    return serialize(appointment)


def ics_text(appointment):
    d = appointment.data
    start = datetime.fromisoformat(d["start"]).astimezone(timezone.utc)
    end = start + timedelta(minutes=d["duration"])
    escape = lambda x: (
        str(x)
        .replace("\\", "\\\\")
        .replace("\n", "\\n")
        .replace(",", "\\,")
        .replace(";", "\\;")
        .replace("\r", "")
    )
    return "\r\n".join(
        [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Elo//Agenda//PT-BR",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            f"SEQUENCE:{d.get('sequence', 0)}",
            f"UID:{appointment.id}@elo",
            f"DTSTAMP:{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}",
            f"DTSTART:{start:%Y%m%dT%H%M%SZ}",
            f"DTEND:{end:%Y%m%dT%H%M%SZ}",
            f"SUMMARY:{escape(d['service'])}",
            "STATUS:" + ("CANCELLED" if d["status"] == "cancelled" else "CONFIRMED"),
            "END:VEVENT",
            "END:VCALENDAR",
            "",
        ]
    )


@app.get("/api/chat/{chat_id}/appointments/{appointment_id}/ics")
def download_ics(
    chat_id: str, appointment_id: str, request: Request, db: Session = Depends(get_db)
):
    c, t = chat_access(db, request, chat_id)
    a = get_record(db, appointment_id, t.id, "appointment")
    if a.data["conversation_id"] != c.id:
        raise HTTPException(404, "Agendamento não encontrado.")
    return Response(
        ics_text(a),
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=agendamento.ics"},
    )


class TicketInput(BaseModel):
    subject: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=10, max_length=4000)
    request_id: str = Field(min_length=8, max_length=80)


@app.post("/api/chat/{chat_id}/tickets")
def create_ticket(
    chat_id: str, body: TicketInput, request: Request, db: Session = Depends(get_db)
):
    c, t = chat_access(db, request, chat_id)
    ensure_not_processing(c)
    d = dict(c.data)
    if (
        d.get("status") != "active"
        or d.get("intent") != "resolucao_problemas"
        or not d.get("identified")
        or not available(db, t, "resolucao_problemas")
    ):
        raise HTTPException(
            409, "Identifique-se na jornada de resolução antes de abrir um chamado."
        )
    existing = [
        x
        for x in records(db, t.id, "ticket")
        if x.data.get("request_id") == body.request_id
        and x.data.get("conversation_id") == c.id
    ]
    if existing:
        return serialize(existing[0])
    ticket = add_record(
        db,
        t.id,
        "ticket",
        {
            **body.model_dump(),
            "contact_id": d["contact_id"],
            "name": d["name"],
            "email": d["email"],
            "status": "open",
            "conversation_id": c.id,
            "assignee_id": d.get("assignee_id"),
        },
    )
    add_message(
        d,
        f"Solicitação registrada: #{ticket.id[:6].upper()}. A equipe vai analisar “{body.subject}”. O problema ainda não está marcado como resolvido.",
        ticket_id=ticket.id,
    )
    d["action"] = None
    c.data = d
    create_invitation(db, t, db.get(Contact, d["contact_id"]))
    db.commit()
    return serialize(ticket)


class OrderInput(BaseModel):
    items: list[dict] = Field(min_length=1, max_length=20)
    request_id: str = Field(min_length=8, max_length=80)


@app.post("/api/chat/{chat_id}/orders")
def create_order(
    chat_id: str, body: OrderInput, request: Request, db: Session = Depends(get_db)
):
    c, t = chat_access(db, request, chat_id)
    ensure_not_processing(c)
    d = dict(c.data)
    if (
        d.get("status") != "active"
        or not available(db, t, "venda")
        or d.get("intent") != "venda"
    ):
        raise HTTPException(409, "Catálogo indisponível nesta jornada.")
    existing = [
        x
        for x in records(db, t.id, "order")
        if x.data.get("request_id") == body.request_id
        and x.data.get("conversation_id") == c.id
    ]
    if existing:
        return serialize(existing[0])
    items = []
    total = 0
    for raw in body.items:
        product = get_record(db, str(raw.get("id", "")), t.id, "product")
        quantity = raw.get("quantity", 1)
        if (
            type(quantity) != int
            or not 1 <= quantity <= 20
            or not product.data.get("active", True)
        ):
            raise HTTPException(422, "Item ou quantidade inválida.")
        items.append(
            {
                "id": product.id,
                "name": product.data["name"],
                "price": product.data["price"],
                "quantity": quantity,
            }
        )
        total += product.data["price"] * quantity
    order = add_record(
        db,
        t.id,
        "order",
        {
            "items": items,
            "total": total,
            "status": "requested",
            "conversation_id": c.id,
            "assignee_id": d.get("assignee_id"),
            "request_id": body.request_id,
            "name": d.get("name", "Cliente anônimo"),
        },
    )
    add_message(
        d,
        f"Pedido #{order.id[:6].upper()} registrado, no total de R$ {total / 100:.2f}. Nenhum pagamento foi cobrado. A equipe pode continuar com você por esta conversa.",
        order_id=order.id,
    )
    c.data = d
    db.commit()
    return serialize(order)


class StatusInput(BaseModel):
    status: str


@app.patch("/api/operations/{kind}/{item_id}")
def operation_status(
    kind: str,
    item_id: str,
    body: StatusInput,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    allowed = {
        "appointment": ["confirmed", "completed", "cancelled"],
        "ticket": ["open", "in_progress", "resolved"],
        "order": ["requested", "processing", "completed", "cancelled"],
    }
    if kind not in allowed or body.status not in allowed[kind]:
        raise HTTPException(422, "Status inválido.")
    item = get_record(db, item_id, user.tenant_id, kind)
    if user.role == "operator":
        c = db.get(Record, item.data["conversation_id"])
        assignee = c.data.get("assignee_id") if c and c.tenant_id == user.tenant_id and c.kind == "conversation" else item.data.get("assignee_id")
        if assignee != user.id:
            raise HTTPException(403, "Assuma a conversa para atualizar a solicitação.")
    if (
        kind == "appointment"
        and item.data["status"] == "cancelled"
        and body.status != "cancelled"
    ):
        raise HTTPException(409, "Crie uma nova reserva para reagendar.")
    item.data = {
        **item.data,
        "status": body.status,
        **(
            {"sequence": item.data.get("sequence", 0) + 1}
            if kind == "appointment"
            else {}
        ),
    }
    if kind == "appointment" and body.status == "cancelled":
        db.execute(delete(Reservation).where(Reservation.record_id == item.id))
    db.commit()
    return serialize(item)


class Activation(BaseModel):
    token: str = Field(min_length=20, max_length=200)


@app.post("/api/customer/activate")
def activate(body: Activation, request: Request, db: Session = Depends(get_db)):
    rate_limit("activate:" + request.client.host, 20, 300)
    invitation = next(
        (
            r
            for r in db.scalars(select(Record).where(Record.kind == "outbox"))
            if r.data.get("token_hash") == digest(body.token)
            and r.data.get("expires", 0) > time.time()
        ),
        None,
    )
    if not invitation:
        raise HTTPException(422, "Link inválido, expirado ou já utilizado.")
    consumed = {
        **invitation.data,
        "token_hash": "",
        "body": "Convite utilizado.",
        "status": "activated",
    }
    claimed = db.execute(
        update(Record)
        .where(
            Record.id == invitation.id,
            Record.data["token_hash"].as_string() == digest(body.token),
        )
        .values(data=consumed)
    )
    if claimed.rowcount != 1:
        db.rollback()
        raise HTTPException(422, "Link já utilizado.")
    contact = db.get(Contact, invitation.data["contact_id"])
    contact.status = "active"
    raw = secrets.token_urlsafe(32)
    add_record(
        db,
        contact.tenant_id,
        "customer_session",
        {
            "token_hash": digest(raw),
            "contact_id": contact.id,
            "expires": int(time.time()) + 86400,
        },
    )
    db.commit()
    return {"token": raw, "name": contact.name}


def customer_access(request, db):
    token = digest(request.headers.get("X-Customer-Token", ""))
    session = next(
        (
            r
            for r in db.scalars(select(Record).where(Record.kind == "customer_session"))
            if r.data.get("token_hash") == token
            and r.data.get("expires", 0) > time.time()
        ),
        None,
    )
    if not session:
        raise HTTPException(401, "Ative sua conta ou solicite um novo link de acesso.")
    return db.get(Contact, session.data["contact_id"])


@app.get("/api/customer/me")
def customer_me(request: Request, db: Session = Depends(get_db)):
    c = customer_access(request, db)
    return {
        "contact": serialize(c),
        "tenant": db.get(Tenant, c.tenant_id).name,
        "slug": db.get(Tenant, c.tenant_id).slug,
        "whatsapp_available": twilio_ready()
        or (DEMO and db.get(Tenant, c.tenant_id).config.get("demo", False)),
        "phone": next(
            (
                r.data
                for r in records(db, c.tenant_id, "customer_profile")
                if r.data.get("contact_id") == c.id
            ),
            None,
        ),
        "appointments": [
            serialize(r)
            for r in records(db, c.tenant_id, "appointment")
            if r.data.get("contact_id") == c.id
        ],
        "tickets": [
            serialize(r)
            for r in records(db, c.tenant_id, "ticket")
            if r.data.get("contact_id") == c.id
        ],
    }


@app.post("/api/customer/logout")
def customer_logout(request: Request, db: Session = Depends(get_db)):
    token = digest(request.headers.get("X-Customer-Token", ""))
    for r in db.scalars(select(Record).where(Record.kind == "customer_session")):
        if r.data.get("token_hash") == token:
            db.delete(r)
    db.commit()
    return {"ok": True}


class AccessRequest(BaseModel):
    slug: str
    email: EmailStr


@app.post("/api/customer/request-access")
def request_access(
    body: AccessRequest, request: Request, db: Session = Depends(get_db)
):
    rate_limit("access:" + request.client.host, 5, 3600)
    t = tenant_for(db, body.slug)
    c = db.scalar(
        select(Contact).where(
            Contact.tenant_id == t.id, Contact.email == str(body.email).lower()
        )
    )
    if c:
        # A fresh single-use link can also authenticate an already activated account.
        create_invitation(db, t, c, force=True)
        db.commit()
    return {
        "message": "Se existir uma conta para esse e-mail, o convite será encaminhado pelo canal configurado."
    }


class PhoneInput(BaseModel):
    phone: str = Field(pattern=r"^\+[1-9]\d{7,14}$")


class VerifyInput(BaseModel):
    challenge_id: str
    code: str = Field(pattern=r"^\d{4,10}$")


def twilio_ready():
    return all(
        os.getenv(k)
        for k in (
            "TWILIO_ACCOUNT_SID",
            "TWILIO_AUTH_TOKEN",
            "TWILIO_VERIFY_SERVICE_SID",
        )
    )


async def twilio_verify(endpoint, data):
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"https://verify.twilio.com/v2/Services/{os.environ['TWILIO_VERIFY_SERVICE_SID']}/{endpoint}",
                auth=(
                    os.environ["TWILIO_ACCOUNT_SID"],
                    os.environ["TWILIO_AUTH_TOKEN"],
                ),
                data=data,
            )
            r.raise_for_status()
        return r.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(
            502,
            "Não foi possível validar pelo WhatsApp. Confira a configuração ou tente novamente.",
        )


@app.post("/api/customer/whatsapp/request")
async def request_otp(
    body: PhoneInput, request: Request, db: Session = Depends(get_db)
):
    contact = customer_access(request, db)
    rate_limit("otp-send:" + contact.id, 3, 600)
    rate_limit("otp-ip:" + request.client.host, 10, 3600)
    tenant = db.get(Tenant, contact.tenant_id)
    demo = DEMO and tenant.config.get("demo", False) and not twilio_ready()
    if not demo and not twilio_ready():
        raise HTTPException(
            503, "Verificação WhatsApp ainda não configurada pela plataforma."
        )
    # Invalidate previous challenges, making a resend a new attempt window.
    for r in records(db, contact.tenant_id, "otp"):
        if r.data.get("contact_id") == contact.id:
            db.delete(r)
    code = str(secrets.randbelow(900000) + 100000)
    verification_sid = None
    if not demo:
        result = await twilio_verify(
            "Verifications", {"To": body.phone, "Channel": "whatsapp"}
        )
        if result.get("status") != "pending":
            raise HTTPException(502, "O provedor não confirmou o envio.")
        verification_sid = result["sid"]
    challenge = add_record(
        db,
        contact.tenant_id,
        "otp",
        {
            "contact_id": contact.id,
            "phone": body.phone,
            "code_hash": digest(code) if demo else "",
            "verification_sid": verification_sid,
            "demo": demo,
            "attempts": 0,
            "expires": int(time.time()) + 600,
        },
    )
    db.commit()
    return {
        "challenge_id": challenge.id,
        "demo": demo,
        "demo_code": code if demo else None,
        "expires_in": 600,
    }


@app.post("/api/customer/whatsapp/verify")
async def verify_otp(
    body: VerifyInput, request: Request, db: Session = Depends(get_db)
):
    contact = customer_access(request, db)
    challenge = get_record(db, body.challenge_id, contact.tenant_id, "otp")
    d = dict(challenge.data)
    if d.get("contact_id") != contact.id or d.get("expires", 0) < time.time():
        raise HTTPException(422, "Código expirado. Solicite outro.")
    if d.get("attempts", 0) >= 5:
        raise HTTPException(
            429, "Limite de tentativas atingido. Solicite outro código."
        )
    d["attempts"] = d.get("attempts", 0) + 1
    challenge.data = d
    db.commit()
    if d["demo"]:
        approved = secrets.compare_digest(digest(body.code), d["code_hash"])
    else:
        result = await twilio_verify(
            "VerificationCheck",
            {"VerificationSid": d["verification_sid"], "Code": body.code},
        )
        approved = result.get("status") == "approved"
    if not approved:
        raise HTTPException(422, "Código incorreto. Confira e tente novamente.")
    profiles = [
        p
        for p in records(db, contact.tenant_id, "customer_profile")
        if p.data.get("contact_id") == contact.id
    ]
    profile = {
        "contact_id": contact.id,
        "phone": d["phone"],
        "phone_verified_at": now(),
        "verification_mode": "demo" if d["demo"] else "whatsapp",
    }
    if profiles:
        profiles[0].data = profile
    else:
        add_record(db, contact.tenant_id, "customer_profile", profile)
    db.delete(challenge)
    db.commit()
    return {"verified": True, "demo": d["demo"], "phone": d["phone"]}


@app.get("/api/customer/appointments/{appointment_id}/ics")
def customer_ics(appointment_id: str, request: Request, db: Session = Depends(get_db)):
    contact = customer_access(request, db)
    a = get_record(db, appointment_id, contact.tenant_id, "appointment")
    if a.data.get("contact_id") != contact.id:
        raise HTTPException(404, "Agendamento não encontrado.")
    return Response(
        ics_text(a),
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=agendamento.ics"},
    )


class RescheduleInput(BaseModel):
    start: str | None = None


@app.post("/api/customer/appointments/{appointment_id}/cancel")
def customer_cancel(
    appointment_id: str, request: Request, db: Session = Depends(get_db)
):
    contact = customer_access(request, db)
    a = get_record(db, appointment_id, contact.tenant_id, "appointment")
    if a.data.get("contact_id") != contact.id:
        raise HTTPException(404, "Agendamento não encontrado.")
    if a.data["status"] == "completed":
        raise HTTPException(409, "Agendamento já concluído.")
    a.data = {
        **a.data,
        "status": "cancelled",
        "sequence": a.data.get("sequence", 0) + 1,
    }
    db.execute(delete(Reservation).where(Reservation.record_id == a.id))
    db.commit()
    return serialize(a)


@app.post("/api/customer/appointments/{appointment_id}/reschedule")
def customer_reschedule(
    appointment_id: str,
    body: RescheduleInput,
    request: Request,
    db: Session = Depends(get_db),
):
    contact = customer_access(request, db)
    a = get_record(db, appointment_id, contact.tenant_id, "appointment")
    if a.data.get("contact_id") != contact.id:
        raise HTTPException(404, "Agendamento não encontrado.")
    if a.data["status"] != "confirmed":
        raise HTTPException(
            409, "Somente agendamentos confirmados podem ser remarcados."
        )
    t = db.get(Tenant, contact.tenant_id)
    if not available(db, t, "agendamento"):
        raise HTTPException(409, "Agendamento indisponível.")
    service = get_record(db, a.data["service_id"], contact.tenant_id, "service")
    if not body.start or body.start not in slots_for(db, t, service, body.start[:10]):
        raise HTTPException(409, "Horário indisponível.")
    db.execute(delete(Reservation).where(Reservation.record_id == a.id))
    dt = datetime.fromisoformat(body.start)
    for minutes in range(0, service.data["duration"], 15):
        db.add(
            Reservation(
                tenant_id=t.id,
                slot=(dt + timedelta(minutes=minutes)).isoformat(),
                record_id=a.id,
            )
        )
    a.data = {
        **a.data,
        "start": body.start,
        "duration": service.data["duration"],
        "sequence": a.data.get("sequence", 0) + 1,
    }
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            409, "Horário reservado por outra pessoa. Sua reserva original foi mantida."
        )
    return serialize(a)


DIST = Path(__file__).resolve().parent.parent / "dist"
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")


@app.get("/{path:path}")
def frontend(path: str):
    if path.startswith("api/"):
        raise HTTPException(404, "Endpoint não encontrado.")
    if DIST.exists():
        return FileResponse(DIST / "index.html")
    return {
        "message": "Elo API está rodando. Inicie o frontend com npm run dev.",
        "docs": "/docs",
    }
