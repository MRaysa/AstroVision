"""Schemas for the star-detection endpoint."""

from __future__ import annotations

from pydantic import BaseModel, Field


class StarDetectionRequest(BaseModel):
    """Request body for ``POST /api/star-detection``."""

    image_id: str
    # Detection threshold expressed in multiples of the background std deviation.
    threshold_sigma: float = Field(default=5.0, ge=1.0, le=50.0)
    # Full width at half maximum (pixels) of the expected stellar PSF.
    fwhm: float = Field(default=3.0, ge=1.0, le=20.0)
    # Cap the number of returned sources (brightest first) to keep payloads small.
    max_stars: int = Field(default=500, ge=1, le=5000)


class Star(BaseModel):
    """A single detected source."""

    x: float
    y: float
    flux: float
    peak: float
    sharpness: float | None = None


class StarDetectionResponse(BaseModel):
    """Result of a star-detection run."""

    count: int
    stars: list[Star]
