"""Sup Better Engine API — FastAPI application factory."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.services.ttl_sweep import sweep_loop

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup: launch background sweep task
    sweep_task = asyncio.create_task(sweep_loop())
    logger.info("Background TTL sweep started")
    yield
    # Shutdown: cancel sweep task
    sweep_task.cancel()
    try:
        await sweep_task
    except asyncio.CancelledError:
        pass
    logger.info("Background TTL sweep stopped")


app = FastAPI(
    title="Sup Better Engine API",
    version="0.1.0",
    description="Lead conversation platform — intent classification, qualification, and backoffice",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routes
app.include_router(api_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
