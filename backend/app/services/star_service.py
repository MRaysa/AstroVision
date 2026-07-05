"""Star (point-source) detection using Photutils' DAOStarFinder."""

from __future__ import annotations

import numpy as np
from photutils.detection import DAOStarFinder

from app.schemas.stars import Star, StarDetectionResponse
from app.services.fits_service import background_stats


def detect_stars(
    data: np.ndarray,
    *,
    threshold_sigma: float = 5.0,
    fwhm: float = 3.0,
    max_stars: int = 500,
) -> StarDetectionResponse:
    """Detect stellar sources and return their pixel coordinates and fluxes.

    A sigma-clipped background is estimated first; sources brighter than
    ``threshold_sigma`` times the background noise are then found with the
    DAOFIND algorithm. Coordinates are in image pixel space with the origin at
    the top-left, matching how the rendered PNG is displayed on the frontend.
    """
    _, median, std = background_stats(data)
    if std <= 0:
        return StarDetectionResponse(count=0, stars=[])

    finder = DAOStarFinder(fwhm=fwhm, threshold=threshold_sigma * std)
    sources = finder(data - median)
    if sources is None or len(sources) == 0:
        return StarDetectionResponse(count=0, stars=[])

    # Brightest first, then cap the payload size.
    sources.sort("flux", reverse=True)
    total = len(sources)
    sources = sources[:max_stars]

    height = data.shape[0]
    stars = [
        Star(
            x=float(row["xcentroid"]),
            # FITS/DAOFind use a bottom-left origin; flip to match the PNG's top-left.
            y=float(height - 1 - row["ycentroid"]),
            flux=float(row["flux"]),
            peak=float(row["peak"]),
            sharpness=float(row["sharpness"]),
        )
        for row in sources
    ]
    return StarDetectionResponse(count=total, stars=stars)
