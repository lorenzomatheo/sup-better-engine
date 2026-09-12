"""Backoffice API — aggregated router for all backoffice endpoints."""

from fastapi import APIRouter

from app.api.backoffice.sessions import router as sessions_router
from app.api.backoffice.leads import router as leads_router
from app.api.backoffice.counters import router as counters_router
from app.api.backoffice.config import router as config_router
from app.api.backoffice.operators import router as operators_router
from app.api.backoffice.audit import router as audit_router

backoffice_router = APIRouter(prefix="/api", tags=["backoffice"])
backoffice_router.include_router(sessions_router)
backoffice_router.include_router(leads_router)
backoffice_router.include_router(counters_router)
backoffice_router.include_router(config_router)
backoffice_router.include_router(operators_router)
backoffice_router.include_router(audit_router)
