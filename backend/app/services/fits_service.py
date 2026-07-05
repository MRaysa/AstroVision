"""Loading, inspecting and rendering FITS images.

This module is the single place that touches Astropy. Everything else in the
backend works with plain numpy arrays and the schema objects produced here.
"""

from __future__ import annotations

import warnings

import numpy as np
from astropy.io import fits
from astropy.io.fits import Header
from astropy.stats import sigma_clipped_stats
from astropy.visualization import AsinhStretch, ZScaleInterval

from app.core.exceptions import InvalidFitsError
from app.schemas.image import HeaderCard, Histogram, Metadata, Statistics
from app.utils.encoding import array_to_png_data_url

# Curated header keywords surfaced in the metadata panel, with common aliases.
_METADATA_KEYS: dict[str, tuple[str, ...]] = {
    "telescope": ("TELESCOP", "TELESCOPE"),
    "instrument": ("INSTRUME", "INSTRUMENT", "DETECTOR"),
    "exposure_time": ("EXPTIME", "EXPOSURE", "ITIME"),
    "observation_date": ("DATE-OBS", "DATE_OBS", "DATE"),
    "object_name": ("OBJECT", "TARGNAME", "TARGET"),
    "filter": ("FILTER", "FILTER1", "FILTNAM"),
}


def load_fits(raw: bytes, *, filename: str) -> tuple[np.ndarray, Header]:
    """Parse FITS bytes into a 2-D float32 array plus its header.

    Raises :class:`InvalidFitsError` for anything that is not a readable FITS
    image (corrupted bytes, tables only, empty primary HDU, etc.).
    """
    import io

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")  # silence non-standard-header warnings
            with fits.open(io.BytesIO(raw), memmap=False) as hdul:
                data, header = _extract_image_hdu(hdul)
    except InvalidFitsError:
        raise
    except Exception as exc:  # noqa: BLE001 - normalise every parse failure
        raise InvalidFitsError(
            f"'{filename}' could not be read as a FITS image. It may be corrupted or unsupported."
        ) from exc

    return _to_2d_float(data), header


def _extract_image_hdu(hdul: fits.HDUList) -> tuple[np.ndarray, Header]:
    """Return the first HDU that actually contains image pixels."""
    for hdu in hdul:
        if (
            getattr(hdu, "data", None) is not None
            and getattr(hdu, "is_image", False)
            and np.asarray(hdu.data).size > 0
        ):
            return np.asarray(hdu.data), hdu.header
    raise InvalidFitsError("The FITS file does not contain any image data.")


def _to_2d_float(data: np.ndarray) -> np.ndarray:
    """Collapse higher-dimensional cubes to a 2-D plane and sanitise values."""
    array = np.asarray(data)
    # Reduce data cubes (e.g. (n, H, W) or (1, 1, H, W)) to their first 2-D plane.
    while array.ndim > 2:
        array = array[0]
    if array.ndim != 2:
        raise InvalidFitsError("Only 2-D FITS images are supported in this MVP.")

    array = array.astype(np.float32, copy=False)
    # Replace NaN/inf so downstream statistics and rendering stay well-defined.
    if not np.isfinite(array).all():
        array = np.nan_to_num(array, nan=0.0, posinf=0.0, neginf=0.0)
    return array


# --------------------------------------------------------------------------- #
# Metadata
# --------------------------------------------------------------------------- #
def build_metadata(data: np.ndarray, header: Header) -> Metadata:
    """Extract the curated metadata subset and the full header table."""
    height, width = data.shape
    bitpix = header.get("BITPIX")
    bit_depth = abs(int(bitpix)) if bitpix is not None else _infer_bit_depth(data.dtype)

    values: dict[str, object] = {}
    for field_name, aliases in _METADATA_KEYS.items():
        values[field_name] = _first_header_value(header, aliases)

    exposure = values.get("exposure_time")
    try:
        exposure_time = float(exposure) if exposure is not None else None
    except (TypeError, ValueError):
        exposure_time = None

    return Metadata(
        telescope=_as_str(values.get("telescope")),
        instrument=_as_str(values.get("instrument")),
        exposure_time=exposure_time,
        observation_date=_as_str(values.get("observation_date")),
        object_name=_as_str(values.get("object_name")),
        filter=_as_str(values.get("filter")),
        width=width,
        height=height,
        bit_depth=bit_depth,
        header=_header_cards(header),
    )


def _first_header_value(header: Header, aliases: tuple[str, ...]) -> object | None:
    for key in aliases:
        if key in header and header[key] not in ("", None):
            return header[key]
    return None


def _header_cards(header: Header) -> list[HeaderCard]:
    cards: list[HeaderCard] = []
    for card in header.cards:
        keyword = str(card.keyword).strip()
        if not keyword or keyword in ("COMMENT", "HISTORY", ""):
            continue
        cards.append(
            HeaderCard(keyword=keyword, value=str(card.value), comment=str(card.comment))
        )
    return cards


def _infer_bit_depth(dtype: np.dtype) -> int:
    return int(np.dtype(dtype).itemsize) * 8


def _as_str(value: object | None) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


# --------------------------------------------------------------------------- #
# Statistics & histogram
# --------------------------------------------------------------------------- #
def compute_statistics(data: np.ndarray) -> Statistics:
    """Descriptive statistics over the raw pixel values."""
    flat = data.astype(np.float64, copy=False).ravel()
    minimum = float(np.min(flat))
    maximum = float(np.max(flat))
    std = float(np.std(flat))
    return Statistics(
        mean=float(np.mean(flat)),
        median=float(np.median(flat)),
        minimum=minimum,
        maximum=maximum,
        std_dev=std,
        variance=float(std * std),
        dynamic_range=float(maximum - minimum),
    )


def compute_histogram(data: np.ndarray, *, bins: int = 256) -> Histogram:
    """Histogram of pixel intensities, clipped to the 0.1–99.9 percentile.

    Clipping keeps a handful of extreme outliers from squashing the whole
    distribution into a single bin, which is common in astronomical frames.
    """
    flat = data.astype(np.float64, copy=False).ravel()
    lo, hi = np.percentile(flat, [0.1, 99.9])
    if not np.isfinite(lo) or not np.isfinite(hi) or hi <= lo:
        lo, hi = float(np.min(flat)), float(np.max(flat))
    if hi <= lo:
        hi = lo + 1.0

    counts, edges = np.histogram(flat, bins=bins, range=(lo, hi))
    return Histogram(bins=[float(e) for e in edges], counts=[int(c) for c in counts])


# --------------------------------------------------------------------------- #
# Rendering
# --------------------------------------------------------------------------- #
def render_display(data: np.ndarray) -> np.ndarray:
    """Produce a display-ready float array in [0, 1].

    Uses a ZScale interval to pick sensible black/white points followed by an
    asinh stretch — the de-facto standard for showing faint astronomical
    structure alongside bright stars.
    """
    interval = ZScaleInterval(contrast=0.25)
    try:
        vmin, vmax = interval.get_limits(data)
    except (ValueError, IndexError):
        vmin, vmax = float(np.min(data)), float(np.max(data))
    if vmax <= vmin:
        vmax = vmin + 1.0

    scaled = np.clip((data - vmin) / (vmax - vmin), 0.0, 1.0)
    stretched = AsinhStretch(a=0.1)(scaled, clip=True)
    return np.asarray(stretched, dtype=np.float32)


def render_to_data_url(data: np.ndarray) -> str:
    """Render raw pixel data to a base64 PNG data URL for the frontend."""
    return array_to_png_data_url(render_display(data))


def background_stats(data: np.ndarray) -> tuple[float, float, float]:
    """Sigma-clipped (mean, median, std) used by star detection."""
    mean, median, std = sigma_clipped_stats(data, sigma=3.0)
    return float(mean), float(median), float(std)
