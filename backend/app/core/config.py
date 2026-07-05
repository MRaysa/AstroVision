"""Application configuration.

Settings are loaded from environment variables (or a local ``.env`` file) via
``pydantic-settings`` so the same code runs unchanged in local dev and on a
hosting platform such as Railway or Render.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Absolute path to ``backend/`` regardless of the current working directory.
BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Runtime configuration for the AstroVision API."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="ASTROVISION_",
        extra="ignore",
    )

    # --- Metadata ---
    project_name: str = "AstroVision API"
    version: str = "0.1.0"
    api_prefix: str = "/api"

    # --- CORS ---
    # Comma-separated list of allowed origins. Defaults cover local Next.js dev.
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # --- Uploads ---
    # Reject uploads larger than this to protect the server (bytes). Default 64 MB.
    max_upload_bytes: int = 64 * 1024 * 1024
    allowed_extensions: tuple[str, ...] = (".fits", ".fit", ".fts", ".fits.gz")

    # --- In-memory image store ---
    # Maximum number of loaded images kept in memory before the oldest is evicted.
    max_cached_images: int = 32

    # --- Sample data ---
    sample_data_dir: Path = BACKEND_ROOT / "sample_data"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse the comma-separated ``cors_origins`` into a clean list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached ``Settings`` instance."""
    return Settings()


settings = get_settings()
