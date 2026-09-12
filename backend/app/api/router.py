"""API router — aggregates all sub-routers."""

from fastapi import APIRouter

from app.api.chat import router as chat_router
from app.api.auth import router as auth_router
from app.api.backoffice import backoffice_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(backoffice_router)
