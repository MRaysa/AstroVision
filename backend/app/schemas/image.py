"""Schemas describing a loaded FITS image, its metadata and statistics."""

from __future__ import annotations

from pydantic import BaseModel, Field


class HeaderCard(BaseModel):
    """A single FITS header keyword/value/comment triple."""

    keyword: str
    value: str
    comment: str = ""


class Metadata(BaseModel):
    """Human-friendly, curated subset of common FITS header keywords."""

    telescope: str | None = None
    instrument: str | None = None
    exposure_time: float | None = None
    observation_date: str | None = None
    object_name: str | None = None
    filter: str | None = None
    width: int
    height: int
    bit_depth: int
    # Full header, exposed as an ordered list so the frontend can render a table.
    header: list[HeaderCard] = Field(default_factory=list)


class Statistics(BaseModel):
    """Descriptive statistics computed on the raw pixel data."""

    mean: float
    median: float
    minimum: float
    maximum: float
    std_dev: float
    variance: float
    dynamic_range: float


class Histogram(BaseModel):
    """Histogram of pixel intensities for charting on the frontend."""

    # ``bins`` has length ``len(counts) + 1`` (bin edges), matching numpy.histogram.
    bins: list[float]
    counts: list[int]


class ImagePayload(BaseModel):
    """The full response returned after loading a FITS image."""

    id: str = Field(description="Server-side identifier used for subsequent processing calls.")
    filename: str
    width: int
    height: int
    # Rendered preview as a base64-encoded PNG data URL (data:image/png;base64,...).
    image: str
    metadata: Metadata
    statistics: Statistics
    histogram: Histogram
