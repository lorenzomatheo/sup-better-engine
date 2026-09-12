import os
import tempfile

os.environ["DATABASE_URL"] = os.getenv("ELO_TEST_DATABASE_URL") or "sqlite:///" + tempfile.mktemp(suffix=".db")
os.environ["DEMO_MODE"] = "true"
os.environ["OPENAI_API_KEY"] = ""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.agent import local_classify
from backend.db import SessionLocal, Record, Contact, User, Tenant
from sqlalchemy import select


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def admin(client):
    client.post("/api/auth/demo")
    return client


def start(client):
    r = client.post("/api/public/studio-aurora/sessions", json={"origin": "whatsapp"})
    assert r.status_code == 200, r.text
    s = r.json()
    return s["conversation"]["id"], {"X-Chat-Token": s["token"]}


def message(client, c, h, text, request_id=None):
    import secrets

    r = client.post(
        f"/api/chat/{c}/messages",
        headers=h,
        json={"content": text, "request_id": request_id or secrets.token_hex(10)},
    )
    assert r.status_code == 200, r.text
    return r.json()


def identify(client, c, h, email="cliente.teste@gmail.com"):
    r = client.post(
        f"/api/chat/{c}/identify",
        headers=h,
        json={"name": "Cliente Teste", "email": email, "consent": True},
    )
    assert r.status_code == 200, r.text
    return r.json()


@pytest.mark.parametrize(
    "text,intent",
    [
        ("Qual o horário de vocês?", "atendimento"),
        ("Como funciona a troca?", "atendimento"),
        ("Quero agendar uma conversa", "agendamento"),
        ("Preciso resolver um problema no meu pedido", "resolucao_problemas"),
        ("Quero ver o catálogo", "venda"),
        ("Quero um orçamento para minha empresa", "qualificacao"),
        ("Olá", "indefinida"),
        ("Não quero mais agendar, só uma dúvida", "atendimento"),
    ],
)
def test_intent_node(text, intent):
    assert local_classify(text).intent == intent


def test_anonymous_routes_never_identify(client):
    c, h = start(client)
    for text in [
        "Qual o horário?",
        "Quero um orçamento para minha empresa",
        "Tenho urgência para a próxima semana",
        "Somos uma empresa pequena",
        "Preciso para amanhã",
        "Quero ver o catálogo",
    ]:
        d = message(client, c, h, text)
        assert not d["needs_identity"]
        assert not d["identified"]
        assert d["identity_requests"] == 0
    r = client.post(
        f"/api/chat/{c}/identify",
        headers=h,
        json={"name": "Proibido", "email": "teste@gmail.com", "consent": True},
    )
    assert r.status_code == 409


def test_intent_change_cancels_identity_and_reuses_session(client):
    c, h = start(client)
    d = message(client, c, h, "Qual o horário?")
    assert d["first_intent"] == "atendimento"
    d = message(client, c, h, "Quero agendar uma conversa")
    assert d["needs_identity"]
    d = message(client, c, h, "Como funciona a troca?")
    assert not d["needs_identity"]
    assert (
        client.post(
            f"/api/chat/{c}/identify",
            headers=h,
            json={"name": "Teste", "email": "teste@gmail.com", "consent": True},
        ).status_code
        == 409
    )
    d = message(client, c, h, "Preciso resolver um problema")
    assert d["needs_identity"]
    d = identify(client, c, h)
    assert d["action"] == "support"
    assert d["first_intent"] == "atendimento"
    d = message(client, c, h, "Quero agendar")
    assert d["action"] == "schedule" and not d["needs_identity"]


def test_identity_requires_consent_and_normalizes_email(client):
    c, h = start(client)
    message(client, c, h, "Quero agendar")
    assert (
        client.post(
            f"/api/chat/{c}/identify",
            headers=h,
            json={
                "name": "Teste",
                "email": "cliente.teste@gmail.com",
                "consent": False,
            },
        ).status_code
        == 422
    )
    identify(client, c, h, "CLIENTE.TESTE@gmail.com")
    with SessionLocal() as db:
        matches = list(
            db.scalars(
                select(Contact).where(Contact.email == "cliente.teste@gmail.com")
            )
        )
        assert len(matches) == 1


def test_chat_secret_and_idempotency(client):
    c, h = start(client)
    assert client.get(f"/api/chat/{c}").status_code == 404
    assert (
        client.get(f"/api/chat/{c}", headers={"X-Chat-Token": "wrong"}).status_code
        == 404
    )
    a = message(client, c, h, "Qual o horário?", "same-id-123456")
    b = message(client, c, h, "Qual o horário?", "same-id-123456")
    assert len(a["messages"]) == len(b["messages"])
    assert "token_hash" not in b


def test_booking_conflicts_ics_and_idempotency(client):
    services = client.get("/api/public/studio-aurora/services").json()
    service = services[0]
    day = (datetime.now(ZoneInfo("America/Sao_Paulo")) + timedelta(days=2)).date()
    while day.weekday() > 4:
        day += timedelta(days=1)
    slots = client.get(
        f"/api/public/studio-aurora/slots?service_id={service['id']}&day={day.isoformat()}"
    ).json()
    assert slots
    c, h = start(client)
    message(client, c, h, "Quero agendar")
    identify(client, c, h)
    body = {
        "service_id": service["id"],
        "start": slots[0],
        "request_id": "booking-unique-123",
    }
    r = client.post(f"/api/chat/{c}/book", headers=h, json=body)
    assert r.status_code == 200, r.text
    a = r.json()
    assert (
        client.post(f"/api/chat/{c}/book", headers=h, json=body).json()["id"] == a["id"]
    )
    c2, h2 = start(client)
    message(client, c2, h2, "Quero agendar")
    identify(client, c2, h2)
    assert (
        client.post(
            f"/api/chat/{c2}/book",
            headers=h2,
            json={**body, "request_id": "other-booking-123"},
        ).status_code
        == 409
    )
    ics = client.get(f"/api/chat/{c}/appointments/{a['id']}/ics", headers=h)
    assert (
        ics.status_code == 200
        and "BEGIN:VCALENDAR" in ics.text
        and "DTSTART" in ics.text
    )
    assert (
        client.get(f"/api/chat/{c2}/appointments/{a['id']}/ics", headers=h2).status_code
        == 404
    )


def test_support_and_activation(client):
    c, h = start(client)
    message(client, c, h, "Preciso resolver um problema")
    identify(client, c, h, "outrapessoa@gmail.com")
    body = {
        "subject": "Arquivo não abre",
        "description": "Tentei abrir o arquivo e recebi um erro.",
        "request_id": "ticket-unique-123",
    }
    r = client.post(f"/api/chat/{c}/tickets", headers=h, json=body)
    assert r.status_code == 200, r.text
    assert (
        client.post(f"/api/chat/{c}/tickets", headers=h, json=body).json()["id"]
        == r.json()["id"]
    )
    with SessionLocal() as db:
        outbox = next(
            r
            for r in db.scalars(select(Record).where(Record.kind == "outbox"))
            if r.data["to"] == "outrapessoa@gmail.com"
        )
        token = outbox.data["body"].split("token=")[1].split()[0]
    response = client.post("/api/customer/activate", json={"token": token})
    assert response.status_code == 200, response.text
    access = {"X-Customer-Token": response.json()["token"]}
    data = client.get("/api/customer/me", headers=access).json()
    assert data["contact"]["status"] == "active" and len(data["tickets"]) == 1
    assert (
        client.post("/api/customer/activate", json={"token": token}).status_code == 422
    )
    assert client.get("/api/customer/me").status_code == 401
    client.post("/api/customer/logout", headers=access)
    assert client.get("/api/customer/me", headers=access).status_code == 401
    # An activated customer must be able to log in again with a fresh link.
    requested = client.post("/api/customer/request-access", json={
        "slug": "studio-aurora", "email": "outrapessoa@gmail.com"
    })
    assert requested.status_code == 200
    with SessionLocal() as db:
        fresh = next(r for r in db.scalars(select(Record).where(Record.kind == "outbox"))
                     if r.data["to"] == "outrapessoa@gmail.com" and r.data.get("token_hash"))
        fresh_token = fresh.data["body"].split("token=")[1].split()[0]
    assert fresh_token != token
    assert client.post("/api/customer/activate", json={"token": fresh_token}).status_code == 200


def test_order_anonymous_server_pricing(client):
    c, h = start(client)
    message(client, c, h, "Quero ver o catálogo")
    product = client.get("/api/public/studio-aurora/catalog").json()[0]
    body = {
        "items": [{"id": product["id"], "quantity": 2, "price": 1}],
        "request_id": "order-test-123456",
    }
    r = client.post(f"/api/chat/{c}/orders", headers=h, json=body)
    assert r.status_code == 200, r.text
    assert r.json()["total"] == product["price"] * 2
    assert (
        client.post(f"/api/chat/{c}/orders", headers=h, json=body).json()["id"]
        == r.json()["id"]
    )
    assert not client.get(f"/api/chat/{c}", headers=h).json()["identified"]


def test_disabled_feature_falls_back_without_identity(admin):
    ws = admin.get("/api/workspace").json()
    config = ws["tenant"]["config"]
    name = ws["tenant"]["name"]
    assert (
        admin.patch(
            "/api/workspace",
            json={**config, "name": name, "enabled": ["atendimento", "qualificacao"]},
        ).status_code
        == 200
    )
    c, h = start(admin)
    d = message(admin, c, h, "Quero agendar")
    assert (
        not d["needs_identity"]
        and "não está disponível" in d["messages"][-1]["content"]
    )
    assert (
        admin.patch("/api/workspace", json={**config, "name": name}).status_code == 200
    )


def test_handoff_pauses_agent(admin):
    c, h = start(admin)
    d = message(admin, c, h, "Quero falar com um atendente humano")
    assert d["status"] == "waiting"
    r = admin.post(f"/api/conversations/{c}/action", json={"action": "claim"})
    assert r.status_code == 200
    before = len(r.json()["messages"])
    d = message(admin, c, h, "Qual o horário?")
    assert d["status"] == "human" and len(d["messages"]) == before + 1
    assert (
        admin.post(
            f"/api/conversations/{c}/action",
            json={"action": "reply", "content": "Olá, sou da equipe."},
        ).status_code
        == 200
    )
    d = admin.post(f"/api/conversations/{c}/action", json={"action": "release"}).json()
    assert d["status"] == "active"
    d = message(admin, c, h, "Qual o horário?")
    assert d["messages"][-1]["role"] == "assistant"


def test_tenant_isolation_roles_and_csrf(admin):
    conversation = admin.get("/api/conversations").json()[0]
    r = admin.post(
        "/api/auth/register",
        json={
            "name": "Outra Gestora",
            "company": "Outra Empresa",
            "email": "gestora@example.org",
            "password": "A-Strong-Pass-2026",
        },
    )
    assert r.status_code == 200, r.text
    assert admin.get("/api/conversations").json() == []
    assert (
        admin.post(
            f"/api/conversations/{conversation['id']}/action", json={"action": "claim"}
        ).status_code
        == 404
    )
    assert (
        admin.post(
            "/api/team",
            json={
                "name": "Operador",
                "email": "operador@example.org",
                "password": "OperatorPass2026!",
                "role": "operator",
            },
        ).status_code
        == 200
    )
    admin.post(
        "/api/auth/login",
        json={"email": "operador@example.org", "password": "OperatorPass2026!"},
    )
    assert (
        admin.post(
            "/api/items/knowledge", json={"data": {"title": "X", "content": "Y"}}
        ).status_code
        == 403
    )
    assert admin.get("/api/items/outbox").status_code == 403
    assert admin.get("/api/team").status_code == 403
    assert (
        admin.post(
            "/api/auth/logout", headers={"Origin": "https://evil.example"}
        ).status_code
        == 403
    )
    admin.post("/api/auth/logout")
    assert admin.get("/api/workspace").status_code == 401


def test_publish_requires_context(admin):
    admin.post(
        "/api/auth/register",
        json={
            "name": "Nova Gestora",
            "company": "Sem Contexto",
            "email": "semcontexto@example.org",
            "password": "A-Strong-Pass-2026",
        },
    )
    ws = admin.get("/api/workspace").json()
    response = admin.patch(
        "/api/workspace",
        json={
            **ws["tenant"]["config"],
            "name": ws["tenant"]["name"],
            "published": True,
        },
    )
    assert response.status_code == 422


def test_whatsapp_otp_and_customer_booking_controls(client):
    c, h = start(client)
    message(client, c, h, "Quero agendar")
    identify(client, c, h, "portal-completo@gmail.com")
    service = client.get("/api/public/studio-aurora/services").json()[0]
    day = (datetime.now(ZoneInfo("America/Sao_Paulo")) + timedelta(days=5)).date()
    while day.weekday() > 4:
        day += timedelta(days=1)

    def slots():
        return client.get(
            f"/api/public/studio-aurora/slots?service_id={service['id']}&day={day.isoformat()}"
        ).json()

    initial = slots()[0]
    a = client.post(
        f"/api/chat/{c}/book",
        headers=h,
        json={
            "service_id": service["id"],
            "start": initial,
            "request_id": "portal-book-123",
        },
    ).json()
    with SessionLocal() as db:
        invite = next(
            r
            for r in db.scalars(select(Record).where(Record.kind == "outbox"))
            if r.data["to"] == "portal-completo@gmail.com"
        )
        token = invite.data["body"].split("token=")[1].split()[0]
    response = client.post("/api/customer/activate", json={"token": token})
    assert response.status_code == 200, response.text
    access = {"X-Customer-Token": response.json()["token"]}
    otp = client.post(
        "/api/customer/whatsapp/request",
        headers=access,
        json={"phone": "+5511999999999"},
    )
    assert otp.status_code == 200, otp.text
    challenge = otp.json()
    assert challenge["demo"]
    wrong = client.post(
        "/api/customer/whatsapp/verify",
        headers=access,
        json={"challenge_id": challenge["challenge_id"], "code": "000000"},
    )
    assert wrong.status_code == 422
    verified = client.post(
        "/api/customer/whatsapp/verify",
        headers=access,
        json={
            "challenge_id": challenge["challenge_id"],
            "code": challenge["demo_code"],
        },
    )
    assert verified.status_code == 200
    assert (
        client.post(
            "/api/customer/whatsapp/verify",
            headers=access,
            json={
                "challenge_id": challenge["challenge_id"],
                "code": challenge["demo_code"],
            },
        ).status_code
        == 404
    )
    result = client.post(
        f"/api/customer/appointments/{a['id']}/reschedule",
        headers=access,
        json={"start": slots()[0]},
    )
    assert result.status_code == 200, result.text
    assert result.json()["start"] != initial
    assert initial in slots()
    calendar = client.get(f"/api/customer/appointments/{a['id']}/ics", headers=access)
    assert "SEQUENCE:1" in calendar.text
    assert (
        client.post(
            f"/api/customer/appointments/{a['id']}/cancel", headers=access
        ).status_code
        == 200
    )
    calendar = client.get(f"/api/customer/appointments/{a['id']}/ics", headers=access)
    assert "STATUS:CANCELLED" in calendar.text and "SEQUENCE:2" in calendar.text


def test_model_call_uses_strict_schema_and_no_response_storage(monkeypatch):
    import asyncio
    import backend.agent as agent

    monkeypatch.setenv("OPENAI_API_KEY", "test-key-not-real")
    sent = []

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "status": "completed",
                "output": [
                    {
                        "type": "message",
                        "content": [
                            {
                                "type": "output_text",
                                "text": '{"intent":"atendimento","wants_human":false}',
                            }
                        ],
                    }
                ],
            }

    class FakeClient:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, *args, **kwargs):
            sent.append(kwargs["json"])
            return FakeResponse()

    monkeypatch.setattr(agent.httpx, "AsyncClient", FakeClient)
    result, provider = asyncio.run(agent.classify("Como funciona a troca?", {}))
    assert result.intent == "atendimento" and provider == "openai"
    assert sent[0]["store"] is False
    assert sent[0]["text"]["format"]["strict"] is True
    assert sent[0]["text"]["format"]["schema"]["additionalProperties"] is False


def test_model_failure_falls_back_safely(monkeypatch):
    import asyncio
    import backend.agent as agent

    monkeypatch.setenv("OPENAI_API_KEY", "test-key-not-real")

    async def failed(*args, **kwargs):
        raise ValueError("Refusal or invalid structured output")

    monkeypatch.setattr(agent, "responses", failed)
    result, provider = asyncio.run(agent.classify("Como funciona o agendamento?", {}))
    assert result.intent == "atendimento" and provider == "fallback"


def test_live_human_takeover_wins_over_inflight_llm(admin, monkeypatch):
    import asyncio
    import threading
    from concurrent.futures import ThreadPoolExecutor
    import backend.main as main
    from backend.agent import Classification

    started = threading.Event()
    resume = threading.Event()

    async def slow_classify(*args):
        started.set()
        while not resume.is_set():
            await asyncio.sleep(0.01)
        return Classification(intent="atendimento", wants_human=False), "local"

    monkeypatch.setattr(main, "classify", slow_classify)
    c, h = start(admin)
    with ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(message, admin, c, h, "Qual o horário?")
        assert started.wait(2)
        r = admin.post(f"/api/conversations/{c}/action", json={"action": "claim"})
        assert r.status_code == 200
        resume.set()
        result = future.result(timeout=3)
    assert result["status"] == "human"
    assert result["messages"][-1]["role"] == "user"
    assert any(
        m["role"] == "system" and "entrou" in m["content"] for m in result["messages"]
    )


def test_account_password_recovery_and_session_revocation(client, monkeypatch):
    from backend import account
    captured = []
    monkeypatch.setenv('SMTP_HOST', 'smtp.test')
    monkeypatch.setenv('SMTP_FROM', 'elo@example.org')
    monkeypatch.setattr(account, 'send_reset', lambda email, token: captured.append(token))
    email = 'recovery@example.org'
    old_password = 'Original-password-2026'
    registered = client.post('/api/auth/register', json={'name':'Recovery User','company':'Recovery Co','email':email,'password':old_password})
    assert registered.status_code == 200
    original_cookie = client.cookies.get('elo_session')
    assert client.patch('/api/auth/profile', json={'name':'Updated Name'}).status_code == 200
    assert client.get('/api/auth/me').json()['user']['name'] == 'Updated Name'
    assert client.post('/api/auth/change-password', json={'current_password':'wrong','password':'Other-password-2026'}).status_code == 422
    known = client.post('/api/auth/forgot-password', json={'email':email})
    unknown = client.post('/api/auth/forgot-password', json={'email':'missing@example.org'})
    assert known.json() == unknown.json() and len(captured) == 1
    token = captured[0]
    assert token not in known.text
    assert client.post('/api/auth/reset-password', json={'token':token,'password':'New-password-2026'}).status_code == 200
    assert client.post('/api/auth/reset-password', json={'token':token,'password':'Another-password-2026'}).status_code == 422
    client.cookies.set('elo_session',original_cookie)
    assert client.get('/api/auth/me').status_code == 401
    client.cookies.clear()
    assert client.post('/api/auth/login',json={'email':email,'password':old_password}).status_code == 401
    assert client.post('/api/auth/login',json={'email':email,'password':'New-password-2026'}).status_code == 200
    assert client.post('/api/auth/change-password', json={'current_password':'New-password-2026','password':'Final-password-2026'}).status_code == 200
    assert client.get('/api/auth/me').status_code == 401
    assert client.post('/api/auth/login',json={'email':email,'password':'Final-password-2026'}).status_code == 200


def test_production_refuses_missing_configuration(monkeypatch):
    monkeypatch.setenv('APP_ENV', 'production')
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    with pytest.raises(RuntimeError, match='Missing production configuration'):
        with TestClient(app):
            pass


@pytest.mark.parametrize('policy,explicit,automatic', [
    ('none',False,False), ('client',True,False), ('agent',False,True), ('both',True,True)
])
def test_all_handoff_policies(client, monkeypatch, policy, explicit, automatic):
    import backend.main as main
    with SessionLocal() as db:
        tenant=db.scalar(select(Tenant).where(Tenant.slug=='studio-aurora'))
        old=dict(tenant.config)
        tenant.config={**old,'handoff':policy}
        db.commit()
    async def needs_team(*args, **kwargs):
        return 'Não encontrei essa informação no contexto.', 'local', True
    monkeypatch.setattr(main,'answer',needs_team)
    try:
        c,h=start(client)
        assert (message(client,c,h,'Quero falar com um atendente humano')['status']=='waiting') == explicit
        c,h=start(client)
        assert (message(client,c,h,'Qual a política de uma situação não documentada?')['status']=='waiting') == automatic
    finally:
        with SessionLocal() as db:
            tenant=db.scalar(select(Tenant).where(Tenant.slug=='studio-aurora'))
            tenant.config=old
            db.commit()


def test_operator_assignment_and_durable_ticket_after_chat_cleanup(admin):
    email='operator-durable@example.org'
    member=admin.post('/api/team',json={'name':'Operador Durável','email':email,'password':'Operator-pass-2026','role':'operator'}).json()
    c,h=start(admin)
    message(admin,c,h,'Preciso resolver um problema')
    identify(admin,c,h,'durable-client@gmail.com')
    ticket=admin.post(f'/api/chat/{c}/tickets',headers=h,json={'subject':'Problema durável','description':'Chamado deve permanecer após o histórico expirar.','request_id':'durable-ticket-2026'}).json()
    assert admin.post(f'/api/conversations/{c}/action',json={'action':'assign','assignee_id':member['id']}).status_code==200
    admin.post('/api/auth/login',json={'email':email,'password':'Operator-pass-2026'})
    assert admin.get('/api/team').status_code==403
    assert admin.post(f'/api/conversations/{c}/action',json={'action':'reply','content':'Vou acompanhar o chamado.'}).status_code==200
    path=f"/api/operations/ticket/{ticket['id']}"
    assert admin.patch(path,json={'status':'in_progress'}).status_code==200
    with SessionLocal() as db:
        db.delete(db.get(Record,c));db.commit()
    result=admin.patch(path,json={'status':'resolved'})
    assert result.status_code==200, result.text


def test_context_upload_and_invalid_payloads(admin):
    assert admin.post('/api/knowledge/upload',files={'file':('info.md',b'Atendemos das 9h as 18h.','text/markdown')}).status_code==200
    assert admin.post('/api/knowledge/upload',files={'file':('empty.md',b'   ','text/markdown')}).status_code==422
    assert admin.post('/api/knowledge/upload',files={'file':('info.exe',b'no','application/octet-stream')}).status_code==422
    assert admin.post('/api/items/knowledge',json={'data':{'title':'Bad','content':{'nested':'object'}}}).status_code==422
    assert admin.post('/api/items/service',json={'data':{'name':'Service','duration':'invalid'}}).status_code==422


def test_integration_sync_replaces_context_and_preserves_it_on_failure(admin,monkeypatch):
    import httpx
    import backend.main as main
    endpoint='https://context.example.org/export'
    item=admin.post('/api/items/integration',json={'data':{'name':'Context CRM','url':endpoint,'type':'crm'}}).json()
    path=f"/api/integrations/{item['id']}/sync"
    assert admin.post(path).status_code==422
    monkeypatch.setenv('INTEGRATION_ALLOWED_HOSTS',' context.example.org ')
    payload={'documents':[{'title':'Importado','content':'Contexto válido.','category':'general'}]}
    class FakeClient:
        def __init__(self,*args,**kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*args): pass
        async def get(self,url,headers):
            return httpx.Response(200,json=payload,request=httpx.Request('GET',url))
    monkeypatch.setattr(main.httpx,'AsyncClient',FakeClient)
    for _ in range(2):
        result=admin.post(path)
        assert result.status_code==200,result.text
    docs=admin.get('/api/items/knowledge').json()
    assert len([d for d in docs if d.get('integration_id')==item['id']])==1
    payload['documents']=[{'title':'Bad','content':[]}]
    assert admin.post(path).status_code in (422,502)
    docs=admin.get('/api/items/knowledge').json()
    assert len([d for d in docs if d.get('integration_id')==item['id']])==1
