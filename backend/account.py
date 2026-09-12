"""Account management and single-use password recovery; never expose recovery tokens."""
import os
import secrets
import smtplib
import time
from email.message import EmailMessage
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import delete, select, update, String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, Session
from backend.db import Base, User, AuthSession, get_db
from backend.security import current_user, digest, password_hash, password_verify, rate_limit

router = APIRouter(prefix="/api/auth")

class PasswordReset(Base):
    __tablename__ = "password_resets"
    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(32), index=True)
    expires: Mapped[int] = mapped_column(Integer)
    password_version: Mapped[str] = mapped_column(Text)

class ForgotInput(BaseModel):
    email: EmailStr

class ResetInput(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    password: str = Field(min_length=10, max_length=200)

class ChangeInput(BaseModel):
    current_password: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=10, max_length=200)

class ProfileInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)

def send_reset(email, token):
    msg = EmailMessage()
    msg['Subject'] = 'Redefina sua senha · Elo'
    msg['From'] = os.environ['SMTP_FROM']
    msg['To'] = email
    url = os.environ.get('PUBLIC_URL', 'http://localhost:5173').rstrip('/')
    msg.set_content(f'Recebemos um pedido para redefinir sua senha.\n{url}/reset-password?token={token}\n\nO link é de uso único e expira em 30 minutos. Se não foi você, ignore este e-mail.')
    with smtplib.SMTP(os.environ['SMTP_HOST'], int(os.getenv('SMTP_PORT','587')), timeout=10) as smtp:
        smtp.starttls()
        if os.getenv('SMTP_USER'):
            smtp.login(os.environ['SMTP_USER'], os.environ['SMTP_PASSWORD'])
        smtp.send_message(msg)

@router.post('/forgot-password')
def forgot(body: ForgotInput, request: Request, db: Session = Depends(get_db)):
    rate_limit('forgot-ip:'+request.client.host, 10, 3600)
    email = str(body.email).lower()
    rate_limit('forgot-email:'+digest(email), 3, 3600)
    generic = {'message': 'Se houver uma conta para esse e-mail, você receberá um link de recuperação.'}
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        return generic
    if not os.getenv('SMTP_HOST') or not os.getenv('SMTP_FROM'):
        return generic
    token = secrets.token_urlsafe(32)
    db.execute(delete(PasswordReset).where(PasswordReset.expires < int(time.time())))
    db.add(PasswordReset(token=digest(token), user_id=user.id, expires=int(time.time())+1800, password_version=digest(user.password)))
    db.commit()
    try:
        send_reset(email, token)
    except Exception:
        db.execute(delete(PasswordReset).where(PasswordReset.token == digest(token)))
        db.commit()
    return generic

@router.post('/reset-password')
def reset(body: ResetInput, request: Request, response: Response, db: Session = Depends(get_db)):
    rate_limit('reset:'+request.client.host, 15, 3600)
    record = db.get(PasswordReset, digest(body.token))
    user = db.get(User, record.user_id) if record else None
    if not record or record.expires <= time.time() or not user or digest(user.password) != record.password_version:
        raise HTTPException(422, 'Link inválido ou expirado. Solicite outro.')
    consumed = db.execute(delete(PasswordReset).where(PasswordReset.token == record.token, PasswordReset.expires > int(time.time())))
    if consumed.rowcount != 1:
        db.rollback()
        raise HTTPException(422, 'Link já utilizado.')
    changed = db.execute(update(User).where(User.id == user.id, User.password == user.password).values(password=password_hash(body.password)))
    if changed.rowcount != 1:
        db.rollback()
        raise HTTPException(422, 'Link inválido. Solicite outro.')
    db.execute(delete(AuthSession).where(AuthSession.user_id == user.id))
    db.execute(delete(PasswordReset).where(PasswordReset.user_id == user.id))
    db.commit()
    response.delete_cookie('elo_session')
    return {'ok': True}

@router.patch('/profile')
def profile(body: ProfileInput, user: User = Depends(current_user), db: Session = Depends(get_db)):
    name = body.name.strip()
    if len(name) < 2:
        raise HTTPException(422, 'Informe seu nome.')
    user.name = name
    db.commit()
    return {'name': name}

@router.post('/change-password')
def change(body: ChangeInput, request: Request, response: Response, user: User = Depends(current_user), db: Session = Depends(get_db)):
    rate_limit('change-password:'+user.id, 5, 300)
    if not password_verify(body.current_password, user.password):
        raise HTTPException(422, 'Senha atual incorreta.')
    user.password = password_hash(body.password)
    db.execute(delete(AuthSession).where(AuthSession.user_id == user.id))
    db.execute(delete(PasswordReset).where(PasswordReset.user_id == user.id))
    db.commit()
    response.delete_cookie('elo_session')
    return {'ok': True}
