"""AstroVision FastAPI application entrypoint.

Run locally with::

    uvicorn app.main:app --reload

The app mounts every route under ``/api`` (see ``settings.api_prefix``) and
exposes interactive docs at ``/docs``.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.project_name,
        version=settings.version,
        description="Backend for AstroVision — FITS loading, analysis and processing.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.api_prefix)

    @app.get("/", tags=["root"])
    async def root() -> dict[str, str]:
        return {"name": settings.project_name, "docs": "/docs", "health": f"{settings.api_prefix}/health"}

    return app


app = create_app()
