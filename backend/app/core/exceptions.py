"""Domain-specific exceptions and FastAPI exception handlers.

Every error the API can raise is mapped to a consistent JSON envelope::

    {"error": {"code": "invalid_fits", "message": "..."}}

so the frontend can render friendly, actionable messages.
"""

from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AstroVisionError(Exception):
    """Base class for expected, user-facing application errors."""

    code: str = "error"
    status_code: int = status.HTTP_400_BAD_REQUEST

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class InvalidFitsError(AstroVisionError):
    """The uploaded file is not a valid or readable FITS file."""

    code = "invalid_fits"
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY


class UnsupportedFileError(AstroVisionError):
    """The file extension or content type is not supported."""

    code = "unsupported_file"
    status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE


class FileTooLargeError(AstroVisionError):
    """The upload exceeds the configured size limit."""

    code = "file_too_large"
    status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE


class ImageNotFoundError(AstroVisionError):
    """The referenced image id is unknown or has expired from the cache."""

    code = "image_not_found"
    status_code = status.HTTP_404_NOT_FOUND


class ProcessingError(AstroVisionError):
    """An image-processing operation failed or received invalid parameters."""

    code = "processing_error"
    status_code = status.HTTP_400_BAD_REQUEST


def _envelope(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def register_exception_handlers(app: FastAPI) -> None:
    """Attach JSON error handlers to the FastAPI application."""

    @app.exception_handler(AstroVisionError)
    async def _handle_app_error(_: Request, exc: AstroVisionError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=_envelope(exc.code, exc.message))

    @app.exception_handler(RequestValidationError)
    async def _handle_validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        detail = exc.errors()[0].get("msg", "Invalid request.") if exc.errors() else "Invalid request."
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_envelope("validation_error", detail),
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_envelope("internal_error", "An unexpected error occurred while processing the request."),
        )
