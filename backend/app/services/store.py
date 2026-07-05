"""A small in-memory, LRU-bounded cache of loaded FITS images.

For an MVP this avoids a database while still letting the frontend perform many
processing calls against a single upload. It intentionally lives in process
memory; scaling out would replace this with Redis or object storage (see the
Future Roadmap in the README).
"""

from __future__ import annotations

import uuid
from collections import OrderedDict
from dataclasses import dataclass, field
from threading import Lock

import numpy as np
from astropy.io.fits import Header

from app.core.config import settings
from app.core.exceptions import ImageNotFoundError


@dataclass
class LoadedImage:
    """A FITS image held in memory together with its parsed header."""

    id: str
    filename: str
    data: np.ndarray  # 2-D float32 array of raw pixel values
    header: Header = field(default_factory=Header)


class ImageStore:
    """Thread-safe LRU store keyed by a generated image id."""

    def __init__(self, capacity: int) -> None:
        self._capacity = capacity
        self._items: OrderedDict[str, LoadedImage] = OrderedDict()
        self._lock = Lock()

    def add(self, filename: str, data: np.ndarray, header: Header) -> LoadedImage:
        image_id = uuid.uuid4().hex
        image = LoadedImage(id=image_id, filename=filename, data=data, header=header)
        with self._lock:
            self._items[image_id] = image
            self._items.move_to_end(image_id)
            while len(self._items) > self._capacity:
                self._items.popitem(last=False)
        return image

    def get(self, image_id: str) -> LoadedImage:
        with self._lock:
            image = self._items.get(image_id)
            if image is None:
                raise ImageNotFoundError(
                    "This image is no longer available. Please upload or open it again."
                )
            self._items.move_to_end(image_id)
            return image


# Module-level singleton used across the app.
image_store = ImageStore(capacity=settings.max_cached_images)
