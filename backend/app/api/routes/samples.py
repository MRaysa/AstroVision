"""Sample-dataset routes: list available samples and open one by id."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.helpers import load_and_store
from app.schemas.image import ImagePayload
from app.schemas.samples import SampleList
from app.services import samples_service

router = APIRouter(tags=["samples"])


@router.get("/samples", response_model=SampleList)
async def list_samples() -> SampleList:
    return SampleList(samples=samples_service.list_samples())


@router.post("/samples/{sample_id}/open", response_model=ImagePayload)
async def open_sample(sample_id: str) -> ImagePayload:
    raw, filename = samples_service.read_sample(sample_id)
    return load_and_store(raw, filename=filename)
