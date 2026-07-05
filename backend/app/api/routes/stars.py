"""``POST /api/star-detection`` — detect point sources with Photutils."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.stars import StarDetectionRequest, StarDetectionResponse
from app.services import star_service
from app.services.store import image_store

router = APIRouter(tags=["stars"])


@router.post("/star-detection", response_model=StarDetectionResponse)
async def detect_stars(request: StarDetectionRequest) -> StarDetectionResponse:
    image = image_store.get(request.image_id)
    return star_service.detect_stars(
        image.data,
        threshold_sigma=request.threshold_sigma,
        fwhm=request.fwhm,
        max_stars=request.max_stars,
    )
