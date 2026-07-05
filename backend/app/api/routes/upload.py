"""``POST /api/upload`` — accept a FITS upload and return its full payload."""

from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.api.helpers import load_and_store
from app.core.config import settings
from app.core.exceptions import FileTooLargeError, UnsupportedFileError
from app.schemas.image import ImagePayload

router = APIRouter(tags=["images"])


def _validate_filename(filename: str | None) -> str:
    name = (filename or "").strip()
    lowered = name.lower()
    if not any(lowered.endswith(ext) for ext in settings.allowed_extensions):
        raise UnsupportedFileError(
            "Unsupported file type. Please upload a FITS file (.fits, .fit, .fts)."
        )
    return name


@router.post("/upload", response_model=ImagePayload)
async def upload_fits(file: UploadFile = File(...)) -> ImagePayload:
    filename = _validate_filename(file.filename)

    raw = await file.read()
    if len(raw) == 0:
        raise UnsupportedFileError("The uploaded file is empty.")
    if len(raw) > settings.max_upload_bytes:
        limit_mb = settings.max_upload_bytes // (1024 * 1024)
        raise FileTooLargeError(f"File exceeds the {limit_mb} MB upload limit.")

    return load_and_store(raw, filename=filename)
