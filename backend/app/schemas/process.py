"""Schemas for the image-processing endpoint."""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field

from app.schemas.image import Histogram, Statistics


class OperationType(StrEnum):
    """Supported image-processing operations.

    Adjustments (brightness/contrast/gamma) read numeric params; filters and
    edge detectors read their own kernel/threshold params. Operations are
    applied in order to the *original* pixel data, so an empty list is a reset.
    """

    brightness = "brightness"
    contrast = "contrast"
    gamma = "gamma"
    normalize = "normalize"
    invert = "invert"
    gaussian_blur = "gaussian_blur"
    median_filter = "median_filter"
    sharpen = "sharpen"
    sobel = "sobel"
    laplacian = "laplacian"
    canny = "canny"


class Operation(BaseModel):
    """A single processing step and its parameters."""

    type: OperationType
    # Free-form numeric params interpreted per-operation, e.g.
    # {"value": 1.2} for brightness/contrast/gamma,
    # {"sigma": 2.0} for gaussian_blur, {"size": 3} for median_filter,
    # {"low": 50, "high": 150} for canny.
    params: dict[str, float] = Field(default_factory=dict)


class ProcessRequest(BaseModel):
    """Request body for ``POST /api/process``."""

    image_id: str
    operations: list[Operation] = Field(default_factory=list)


class ProcessResponse(BaseModel):
    """Result of applying a processing pipeline."""

    image: str  # base64 PNG data URL of the processed image
    statistics: Statistics
    histogram: Histogram
