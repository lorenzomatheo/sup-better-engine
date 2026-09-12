import hashlib
import hmac
import secrets
import time
from collections import defaultdict, deque
from threading import Lock
from fastapi import HTTPException, Request, Depends
from sqlalchemy.orm import Session
from backend.db import get_db, AuthSession, User


def password_hash(password):
    salt = secrets.token_hex(16)
    digest = hashlib.scrypt(
        password.encode(), salt=salt.encode(), n=16384, r=8, p=1
    ).hex()
    return f"{salt}${digest}"


def password_verify(password, encoded):
    try:
        salt, digest = encoded.split("$")
        actual = hashlib.scrypt(
            password.encode(), salt=salt.encode(), n=16384, r=8, p=1
        ).hex()
        return hmac.compare_digest(digest, actual)
    except (ValueError, TypeError):
        return False


def digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


def current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("elo_session", "")
    session = db.get(AuthSession, digest(token)) if token else None
    if not session or session.expires < time.time():
        raise HTTPException(401, "Entre na sua conta para continuar.")
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(401, "Sessão inválida.")
    return user


def roles(*allowed):
    def check(user: User = Depends(current_user)):
        if user.role not in allowed:
            raise HTTPException(403, "Seu perfil não permite esta ação.")
        return user

    return check


limits = defaultdict(deque)
lock = Lock()


def rate_limit(key, maximum=60, window=3600):
    stamp = time.time()
    with lock:
        if len(limits) > 10000:
            for k in list(limits):
                if not limits[k] or limits[k][-1] < stamp - 3600:
                    del limits[k]
        q = limits[key]
        while q and q[0] < stamp - window:
            q.popleft()
        if len(q) >= maximum:
            raise HTTPException(
                429, "Muitas tentativas. Aguarde um pouco e tente novamente."
            )
        q.append(stamp)
