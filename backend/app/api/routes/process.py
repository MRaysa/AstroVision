"""``POST /api/process`` — apply an image-processing pipeline."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.process import ProcessRequest, ProcessResponse
from app.services import processing_service
from app.services.store import image_store
from app.utils.encoding import array_to_png_data_url

router = APIRouter(tags=["processing"])


@router.post("/process", response_model=ProcessResponse)
async def process_image(request: ProcessRequest) -> ProcessResponse:
    image = image_store.get(request.image_id)

    display = processing_service.apply_operations(image.data, request.operations)
    return ProcessResponse(
        image=array_to_png_data_url(display),
        statistics=processing_service.processed_statistics(display),
        histogram=processing_service.processed_histogram(display),
    )
