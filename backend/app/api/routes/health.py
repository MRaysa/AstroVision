"""Health-check endpoint used by the frontend and hosting platform."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.project_name, "version": settings.version}
