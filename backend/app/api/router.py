"""Aggregate all API route modules under a single router."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import health, process, samples, stars, upload

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(upload.router)
api_router.include_router(samples.router)
api_router.include_router(process.router)
api_router.include_router(stars.router)
