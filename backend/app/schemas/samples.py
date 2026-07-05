"""Schemas describing bundled sample datasets."""

from __future__ import annotations

from pydantic import BaseModel


class SampleImage(BaseModel):
    """Metadata for a sample FITS file the user can open with one click."""

    id: str
    name: str
    description: str
    filename: str
    # Approximate on-disk size, formatted for display (e.g. "1.2 MB").
    size: str
    category: str


class SampleList(BaseModel):
    samples: list[SampleImage]
