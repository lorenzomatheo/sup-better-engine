"""E2E integration test — full conversation flow.

Requires: PostgreSQL running on port 5433 with sup_better_engine database seeded.
Run: cd backend && python -m pytest tests/integration/test_e2e_flow.py -v
"""

import asyncio
import sys
from pathlib import Path

import httpx
import pytest

# Ensure app is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

BASE_URL = "http://127.0.0.1:8000"


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


class TestE2EFlow:
    """Full conversation flow: message → response → email modal → submit → lead."""

    @pytest.mark.asyncio
    async def test_health_check(self):
        """Backend health endpoint responds."""
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/health")
            assert r.status_code == 200
            assert r.json()["status"] == "ok"

    @pytest.mark.asyncio
    async def test_send_message_and_receive_response(self):
        """Send a message → receive agent response with session_id."""
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{BASE_URL}/api/chat/message",
                json={"message": "Olá, preciso de ajuda com um produto", "origem": "test-e2e"},
                timeout=10,
            )
            assert r.status_code == 200
            data = r.json()
            assert "session_id" in data
            assert "response" in data
            assert data["turn_count"] >= 1
            assert len(data["response"]) > 0
            return data["session_id"]

    @pytest.mark.asyncio
    async def test_full_conversation_flow(self):
        """Multi-turn conversation → email modal → submit email → lead created."""
        async with httpx.AsyncClient() as client:
            session_id = None

            # Turn 1: initial message
            r1 = await client.post(
                f"{BASE_URL}/api/chat/message",
                json={"message": "Quero saber mais sobre o serviço", "session_id": None, "origem": "test-e2e"},
                timeout=10,
            )
            assert r1.status_code == 200
            d1 = r1.json()
            session_id = d1["session_id"]
            assert d1["turn_count"] >= 1

            # Turn 2: describe need
            r2 = await client.post(
                f"{BASE_URL}/api/chat/message",
                json={"message": "Preciso de uma solução urgente para minha empresa", "session_id": session_id, "origem": "test-e2e"},
                timeout=10,
            )
            assert r2.status_code == 200
            d2 = r2.json()
            assert d2["session_id"] == session_id

            # Turn 3: fit description
            r3 = await client.post(
                f"{BASE_URL}/api/chat/message",
                json={"message": "Sim, é exatamente o que procuro para meu negócio", "session_id": session_id, "origem": "test-e2e"},
                timeout=10,
            )
            assert r3.status_code == 200
            d3 = r3.json()

            # Turn 4+: eventually triggers email modal
            # Continue until modal appears or max turns
            show_modal = d3.get("show_email_modal", False)
            for _ in range(5):
                if show_modal:
                    break
                r = await client.post(
                    f"{BASE_URL}/api/chat/message",
                    json={"message": "Ok, continue", "session_id": session_id, "origem": "test-e2e"},
                    timeout=10,
                )
                show_modal = r.json().get("show_email_modal", False)

            # Submit email
            if show_modal:
                email_r = await client.post(
                    f"{BASE_URL}/api/chat/email",
                    json={"session_id": session_id, "email": "test-e2e@example.com"},
                    timeout=10,
                )
                assert email_r.status_code == 200
                email_data = email_r.json()
                assert email_data["success"] is True
                assert email_data["lead_id"] is not None

    @pytest.mark.asyncio
    async def test_email_validation_rejects_disposable(self):
        """Email validation rejects disposable domains."""
        async with httpx.AsyncClient() as client:
            # First create a session
            r = await client.post(
                f"{BASE_URL}/api/chat/message",
                json={"message": "test", "origem": "test-e2e"},
                timeout=10,
            )
            session_id = r.json()["session_id"]

            # Try disposable email
            email_r = await client.post(
                f"{BASE_URL}/api/chat/email",
                json={"session_id": session_id, "email": "test@mailinator.com"},
                timeout=10,
            )
            assert email_r.status_code == 200
            data = email_r.json()
            assert data["success"] is False

    @pytest.mark.asyncio
    async def test_auth_login(self):
        """Login with seeded credentials returns JWT tokens."""
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": "gestao@supbetter.com", "password": "pilot2026!"},
                timeout=10,
            )
            assert r.status_code == 200
            data = r.json()
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["user"]["email"] == "gestao@supbetter.com"

    @pytest.mark.asyncio
    async def test_backoffice_sessions_requires_auth(self):
        """Backoffice endpoints reject unauthenticated requests."""
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{BASE_URL}/api/sessions")
            assert r.status_code == 403  # No Bearer token

    @pytest.mark.asyncio
    async def test_backoffice_sessions_with_auth(self):
        """Backoffice endpoints accept authenticated requests."""
        async with httpx.AsyncClient() as client:
            # Login first
            login_r = await client.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": "operador@supbetter.com", "password": "pilot2026!"},
                timeout=10,
            )
            token = login_r.json()["access_token"]

            # Access sessions
            r = await client.get(
                f"{BASE_URL}/api/sessions",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            assert r.status_code == 200
            data = r.json()
            assert "items" in data
            assert "total" in data

    @pytest.mark.asyncio
    async def test_session_state_endpoint(self):
        """Session state endpoint returns current state."""
        async with httpx.AsyncClient() as client:
            # Create a session first
            msg_r = await client.post(
                f"{BASE_URL}/api/chat/message",
                json={"message": "test session state", "origem": "test-e2e"},
                timeout=10,
            )
            session_id = msg_r.json()["session_id"]

            # Get session state
            r = await client.get(f"{BASE_URL}/api/chat/session/{session_id}")
            assert r.status_code == 200
            data = r.json()
            assert data["session_id"] == session_id
            assert data["expired"] is False
