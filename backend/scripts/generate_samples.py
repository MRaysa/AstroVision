"""Generate synthetic-but-realistic sample FITS files for AstroVision.

Publicly redistributable, ready-made astronomical FITS files are large and
awkward to vendor into a repo, so this script synthesises a small, varied set
of scientifically plausible frames (nebula, galaxies, lunar terrain, star
fields) complete with representative FITS headers. Each frame is deterministic
(seeded) so the samples are reproducible.

Usage::

    python scripts/generate_samples.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from astropy.io import fits

OUT_DIR = Path(__file__).resolve().parents[1] / "sample_data"
RNG = np.random.default_rng(42)


# --------------------------------------------------------------------------- #
# Building blocks
# --------------------------------------------------------------------------- #
def _grid(h: int, w: int) -> tuple[np.ndarray, np.ndarray]:
    y, x = np.mgrid[0:h, 0:w]
    return x.astype(np.float64), y.astype(np.float64)


def _gaussian(x, y, cx, cy, amp, sx, sy=None) -> np.ndarray:
    sy = sy or sx
    return amp * np.exp(-(((x - cx) ** 2) / (2 * sx**2) + ((y - cy) ** 2) / (2 * sy**2)))


def _add_stars(image: np.ndarray, count: int, *, max_amp: float, fwhm: float = 2.5) -> None:
    h, w = image.shape
    x, y = _grid(h, w)
    sigma = fwhm / 2.355
    for _ in range(count):
        cx, cy = RNG.uniform(0, w), RNG.uniform(0, h)
        amp = RNG.uniform(0.1, 1.0) ** 2 * max_amp  # skew toward faint stars
        image += _gaussian(x, y, cx, cy, amp, sigma)


def _poisson_noise(image: np.ndarray, background: float) -> np.ndarray:
    noisy = RNG.poisson(np.clip(image + background, 0, None))
    read_noise = RNG.normal(0, np.sqrt(background) * 0.5, size=image.shape)
    return (noisy + read_noise).astype(np.float32)


def _write(name: str, data: np.ndarray, header_cards: dict[str, object]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    hdu = fits.PrimaryHDU(data=data.astype(np.float32))
    for key, value in header_cards.items():
        hdu.header[key] = value
    hdu.writeto(OUT_DIR / name, overwrite=True)
    print(f"  wrote {name}  ({data.shape[1]}x{data.shape[0]})")


# --------------------------------------------------------------------------- #
# Scenes
# --------------------------------------------------------------------------- #
def horsehead() -> None:
    h, w = 512, 512
    x, y = _grid(h, w)
    # Emission-nebula glow brightening toward the bottom.
    nebula = 400 + 900 * np.clip((y / h) ** 1.5, 0, 1)
    nebula += _gaussian(x, y, w * 0.5, h * 0.9, 700, w * 0.4, h * 0.2)
    # Dark "horsehead" silhouette carved out of the glow.
    head = ((x - w * 0.42) / (w * 0.12)) ** 2 + ((y - h * 0.45) / (h * 0.22)) ** 2 < 1
    snout = (x > w * 0.30) & (x < w * 0.46) & (y > h * 0.30) & (y < h * 0.42)
    nebula[head | snout] *= 0.15
    image = nebula.astype(np.float32)
    _add_stars(image, 220, max_amp=6000)
    data = _poisson_noise(image, background=120)
    _write(
        "HorseHead.fits",
        data,
        {
            "TELESCOP": "AstroVision Virtual Observatory",
            "INSTRUME": "AV-CCD",
            "OBJECT": "Barnard 33 (Horsehead Nebula)",
            "FILTER": "H-alpha",
            "EXPTIME": 1200.0,
            "DATE-OBS": "2024-11-02T03:14:00",
            "BUNIT": "adu",
        },
    )


def andromeda() -> None:
    h, w = 512, 640
    x, y = _grid(h, w)
    # Inclined disk: rotate coordinates and stretch one axis.
    theta = np.deg2rad(35)
    xr = (x - w / 2) * np.cos(theta) + (y - h / 2) * np.sin(theta)
    yr = -(x - w / 2) * np.sin(theta) + (y - h / 2) * np.cos(theta)
    r = np.sqrt(xr**2 + (yr * 3.0) ** 2)
    disk = 5000 * np.exp(-r / 70)  # exponential disk
    bulge = _gaussian(x, y, w / 2, h / 2, 12000, 18)  # bright core
    image = (disk + bulge + 300).astype(np.float32)
    _add_stars(image, 300, max_amp=8000)
    data = _poisson_noise(image, background=90)
    _write(
        "M31.fits",
        data,
        {
            "TELESCOP": "AstroVision Virtual Observatory",
            "INSTRUME": "AV-Wide",
            "OBJECT": "M31 (Andromeda Galaxy)",
            "FILTER": "L",
            "EXPTIME": 600.0,
            "DATE-OBS": "2024-10-18T22:41:30",
            "BUNIT": "adu",
        },
    )


def moon() -> None:
    h, w = 600, 600
    x, y = _grid(h, w)
    # Illumination terminator across the disk.
    illum = np.clip((x / w) * 1.4 - 0.15, 0.05, 1.0)
    surface = 3000 * illum
    # Craters: bright rims with dark floors.
    for _ in range(60):
        cx, cy = RNG.uniform(0, w), RNG.uniform(0, h)
        rad = RNG.uniform(8, 45)
        rim = _gaussian(x, y, cx, cy, 1500, rad * 0.9)
        floor = _gaussian(x, y, cx, cy, 1800, rad * 0.55)
        surface += (rim - floor) * illum
    # Dark maria.
    surface -= _gaussian(x, y, w * 0.35, h * 0.4, 1200, 90) * illum
    image = np.clip(surface, 0, None).astype(np.float32)
    data = _poisson_noise(image, background=60)
    _write(
        "Moon.fits",
        data,
        {
            "TELESCOP": "AstroVision Virtual Observatory",
            "INSTRUME": "AV-Planetary",
            "OBJECT": "Moon (Mare Imbrium region)",
            "FILTER": "IR-pass",
            "EXPTIME": 0.02,
            "DATE-OBS": "2025-01-09T19:05:12",
            "BUNIT": "adu",
        },
    )


def spiral_galaxy() -> None:
    h, w = 512, 512
    x, y = _grid(h, w)
    cx, cy = w / 2, h / 2
    dx, dy = x - cx, y - cy
    r = np.hypot(dx, dy)
    phi = np.arctan2(dy, dx)
    # Two logarithmic spiral arms.
    arms = np.zeros_like(r)
    for offset in (0, np.pi):
        spiral_phase = phi + offset - np.log(r + 1) * 2.5
        arms += (0.5 + 0.5 * np.cos(2 * spiral_phase)) * np.exp(-r / 120)
    image = (6000 * arms + _gaussian(x, y, cx, cy, 9000, 20) + 250).astype(np.float32)
    _add_stars(image, 260, max_amp=7000)
    data = _poisson_noise(image, background=80)
    _write(
        "Galaxy.fits",
        data,
        {
            "TELESCOP": "AstroVision Virtual Observatory",
            "INSTRUME": "AV-Wide",
            "OBJECT": "NGC-AV1 (Spiral Galaxy)",
            "FILTER": "R",
            "EXPTIME": 900.0,
            "DATE-OBS": "2024-12-01T01:22:47",
            "BUNIT": "adu",
        },
    )


def star_field() -> None:
    h, w = 512, 512
    image = np.full((h, w), 200.0, dtype=np.float32)
    _add_stars(image, 800, max_amp=9000, fwhm=2.2)
    data = _poisson_noise(image, background=100)
    _write(
        "StarField.fits",
        data,
        {
            "TELESCOP": "AstroVision Virtual Observatory",
            "INSTRUME": "AV-CCD",
            "OBJECT": "Open Cluster Field",
            "FILTER": "V",
            "EXPTIME": 300.0,
            "DATE-OBS": "2025-02-14T04:30:00",
            "BUNIT": "adu",
        },
    )


def main() -> None:
    print(f"Generating sample FITS files into {OUT_DIR} ...")
    horsehead()
    andromeda()
    moon()
    spiral_galaxy()
    star_field()
    print("Done.")


if __name__ == "__main__":
    main()
