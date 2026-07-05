"""Shared orchestration used by the upload and sample-loading routes."""

from __future__ import annotations

from app.schemas.image import ImagePayload
from app.services import fits_service
from app.services.store import image_store


def load_and_store(raw: bytes, *, filename: str) -> ImagePayload:
    """Parse FITS bytes, cache the array and build the full image payload."""
    data, header = fits_service.load_fits(raw, filename=filename)
    stored = image_store.add(filename=filename, data=data, header=header)

    metadata = fits_service.build_metadata(data, header)
    return ImagePayload(
        id=stored.id,
        filename=filename,
        width=metadata.width,
        height=metadata.height,
        image=fits_service.render_to_data_url(data),
        metadata=metadata,
        statistics=fits_service.compute_statistics(data),
        histogram=fits_service.compute_histogram(data),
    )
