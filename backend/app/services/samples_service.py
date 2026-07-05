"""Discovery and loading of the bundled sample FITS datasets."""

from __future__ import annotations

from pathlib import Path

from app.core.config import settings
from app.core.exceptions import ImageNotFoundError
from app.schemas.samples import SampleImage

# Curated manifest of the sample files shipped in ``backend/sample_data``.
# Keeping this explicit (rather than globbing) lets us present rich, ordered
# descriptions in the UI while keeping ids stable.
_MANIFEST: list[dict[str, str]] = [
    {
        "id": "horsehead",
        "name": "Horsehead Nebula",
        "description": "Dark nebula (Barnard 33) silhouetted against emission — a classic deep-sky target.",
        "filename": "HorseHead.fits",
        "category": "Nebula",
    },
    {
        "id": "m31",
        "name": "M31 — Andromeda Galaxy",
        "description": "The nearest spiral galaxy, showing a bright core and extended disk.",
        "filename": "M31.fits",
        "category": "Galaxy",
    },
    {
        "id": "moon",
        "name": "Lunar Surface",
        "description": "High dynamic-range lunar terrain with craters and mare — great for contrast tools.",
        "filename": "Moon.fits",
        "category": "Solar System",
    },
    {
        "id": "galaxy",
        "name": "Spiral Galaxy Field",
        "description": "A spiral galaxy embedded in a field of foreground stars.",
        "filename": "Galaxy.fits",
        "category": "Galaxy",
    },
    {
        "id": "starfield",
        "name": "Dense Star Field",
        "description": "A rich open-cluster style star field — ideal for the star-detection tool.",
        "filename": "StarField.fits",
        "category": "Star Field",
    },
]

_BY_ID = {entry["id"]: entry for entry in _MANIFEST}


def _human_size(path: Path) -> str:
    if not path.exists():
        return "—"
    num = float(path.stat().st_size)
    for unit in ("B", "KB", "MB"):
        if num < 1024:
            return f"{num:.0f} {unit}" if unit == "B" else f"{num:.1f} {unit}"
        num /= 1024.0
    return f"{num:.1f} GB"


def list_samples() -> list[SampleImage]:
    """Return metadata for every bundled sample that exists on disk."""
    samples: list[SampleImage] = []
    for entry in _MANIFEST:
        path = settings.sample_data_dir / entry["filename"]
        samples.append(
            SampleImage(
                id=entry["id"],
                name=entry["name"],
                description=entry["description"],
                filename=entry["filename"],
                size=_human_size(path),
                category=entry["category"],
            )
        )
    return samples


def read_sample(sample_id: str) -> tuple[bytes, str]:
    """Return the raw bytes and filename for a sample id."""
    entry = _BY_ID.get(sample_id)
    if entry is None:
        raise ImageNotFoundError(f"Unknown sample dataset '{sample_id}'.")

    path = settings.sample_data_dir / entry["filename"]
    if not path.exists():
        raise ImageNotFoundError(
            f"Sample '{entry['name']}' is not available. Run scripts/generate_samples.py."
        )
    return path.read_bytes(), entry["filename"]
