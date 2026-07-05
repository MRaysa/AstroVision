"""Image-processing pipeline: adjustments, filters and edge detection.

Operations run on the *display-stretched* float image (values in [0, 1]) so the
results are visually meaningful, and are applied in the order requested. An
empty pipeline therefore returns the untouched, freshly rendered image (reset).
"""

from __future__ import annotations

import cv2
import numpy as np
from scipy import ndimage

from app.core.exceptions import ProcessingError
from app.schemas.image import Histogram, Statistics
from app.schemas.process import Operation, OperationType
from app.services.fits_service import render_display


def apply_operations(raw: np.ndarray, operations: list[Operation]) -> np.ndarray:
    """Apply a pipeline of operations, returning a float array in [0, 1]."""
    display = render_display(raw)
    for op in operations:
        display = _apply_one(display, op)
    return np.clip(display, 0.0, 1.0).astype(np.float32)


def _apply_one(image: np.ndarray, op: Operation) -> np.ndarray:
    handler = _HANDLERS.get(op.type)
    if handler is None:  # pragma: no cover - guarded by the schema enum
        raise ProcessingError(f"Unknown operation '{op.type}'.")
    try:
        return handler(image, op.params)
    except ProcessingError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise ProcessingError(f"Failed to apply '{op.type.value}': {exc}") from exc


# --------------------------------------------------------------------------- #
# Adjustments
# --------------------------------------------------------------------------- #
def _brightness(image: np.ndarray, params: dict[str, float]) -> np.ndarray:
    value = float(params.get("value", 0.0))  # additive, typically [-1, 1]
    return np.clip(image + value, 0.0, 1.0)


def _contrast(image: np.ndarray, params: dict[str, float]) -> np.ndarray:
    factor = float(params.get("value", 1.0))  # multiplicative around mid-grey
    return np.clip((image - 0.5) * factor + 0.5, 0.0, 1.0)


def _gamma(image: np.ndarray, params: dict[str, float]) -> np.ndarray:
    gamma = max(float(params.get("value", 1.0)), 1e-3)
    return np.power(np.clip(image, 0.0, 1.0), 1.0 / gamma)


def _normalize(image: np.ndarray, _: dict[str, float]) -> np.ndarray:
    lo, hi = float(np.min(image)), float(np.max(image))
    if hi <= lo:
        return np.zeros_like(image)
    return (image - lo) / (hi - lo)


def _invert(image: np.ndarray, _: dict[str, float]) -> np.ndarray:
    return 1.0 - image


# --------------------------------------------------------------------------- #
# Filters
# --------------------------------------------------------------------------- #
def _gaussian_blur(image: np.ndarray, params: dict[str, float]) -> np.ndarray:
    sigma = max(float(params.get("sigma", params.get("value", 2.0))), 0.1)
    return ndimage.gaussian_filter(image, sigma=sigma)


def _median_filter(image: np.ndarray, params: dict[str, float]) -> np.ndarray:
    size = int(params.get("size", params.get("value", 3)))
    size = max(size | 1, 3)  # force an odd kernel >= 3
    return ndimage.median_filter(image, size=size)


def _sharpen(image: np.ndarray, params: dict[str, float]) -> np.ndarray:
    amount = float(params.get("amount", params.get("value", 1.0)))
    blurred = ndimage.gaussian_filter(image, sigma=1.0)
    return np.clip(image + amount * (image - blurred), 0.0, 1.0)


# --------------------------------------------------------------------------- #
# Edge detection
# --------------------------------------------------------------------------- #
def _to_uint8(image: np.ndarray) -> np.ndarray:
    return (np.clip(image, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)


def _normalise01(image: np.ndarray) -> np.ndarray:
    lo, hi = float(np.min(image)), float(np.max(image))
    return (image - lo) / (hi - lo) if hi > lo else np.zeros_like(image)


def _sobel(image: np.ndarray, _: dict[str, float]) -> np.ndarray:
    gx = cv2.Sobel(image, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(image, cv2.CV_32F, 0, 1, ksize=3)
    return _normalise01(np.hypot(gx, gy))


def _laplacian(image: np.ndarray, _: dict[str, float]) -> np.ndarray:
    edges = cv2.Laplacian(image, cv2.CV_32F, ksize=3)
    return _normalise01(np.abs(edges))


def _canny(image: np.ndarray, params: dict[str, float]) -> np.ndarray:
    low = int(params.get("low", 50))
    high = int(params.get("high", 150))
    edges = cv2.Canny(_to_uint8(image), low, high)
    return (edges > 0).astype(np.float32)


_HANDLERS = {
    OperationType.brightness: _brightness,
    OperationType.contrast: _contrast,
    OperationType.gamma: _gamma,
    OperationType.normalize: _normalize,
    OperationType.invert: _invert,
    OperationType.gaussian_blur: _gaussian_blur,
    OperationType.median_filter: _median_filter,
    OperationType.sharpen: _sharpen,
    OperationType.sobel: _sobel,
    OperationType.laplacian: _laplacian,
    OperationType.canny: _canny,
}


# --------------------------------------------------------------------------- #
# Stats/histogram of the processed (display-space) image
# --------------------------------------------------------------------------- #
def processed_statistics(display: np.ndarray) -> Statistics:
    """Statistics of a processed image, reported on the 0–255 display scale."""
    scaled = display.astype(np.float64) * 255.0
    minimum, maximum = float(scaled.min()), float(scaled.max())
    std = float(scaled.std())
    return Statistics(
        mean=float(scaled.mean()),
        median=float(np.median(scaled)),
        minimum=minimum,
        maximum=maximum,
        std_dev=std,
        variance=float(std * std),
        dynamic_range=float(maximum - minimum),
    )


def processed_histogram(display: np.ndarray, *, bins: int = 256) -> Histogram:
    scaled = display.astype(np.float64) * 255.0
    counts, edges = np.histogram(scaled, bins=bins, range=(0.0, 255.0))
    return Histogram(bins=[float(e) for e in edges], counts=[int(c) for c in counts])
