"""Helpers for turning numpy arrays into web-ready, base64-encoded images."""

from __future__ import annotations

import base64
import io

import numpy as np
from PIL import Image


def to_uint8(data: np.ndarray) -> np.ndarray:
    """Clip a float array in the [0, 1] range and scale it to 8-bit."""
    clipped = np.clip(data, 0.0, 1.0)
    return (clipped * 255.0 + 0.5).astype(np.uint8)


def array_to_png_data_url(display: np.ndarray) -> str:
    """Encode a display-ready array (float [0,1] or uint8) as a PNG data URL.

    Accepts either a 2-D grayscale array or a 3-D ``(H, W, 3)`` RGB array.
    """
    if display.dtype != np.uint8:
        display = to_uint8(display)

    mode = "L" if display.ndim == 2 else "RGB"
    image = Image.fromarray(display, mode=mode)

    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"
