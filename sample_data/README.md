# Sample data

The runtime sample FITS files live in [`../backend/sample_data/`](../backend/sample_data/) so the
API can serve them directly. They are **generated** (seeded and reproducible) rather than vendored,
which keeps the repository small.

Generate or refresh them with:

```bash
cd backend
python scripts/generate_samples.py
```

This produces:

| File | Object | Best for |
|------|--------|----------|
| `HorseHead.fits` | Barnard 33 (Horsehead Nebula) | contrast / gamma tools |
| `M31.fits` | Andromeda Galaxy | dynamic range, stretch |
| `Moon.fits` | Lunar terrain | high dynamic range, filters |
| `Galaxy.fits` | Spiral galaxy field | edge detection |
| `StarField.fits` | Dense star field | star detection |

To analyze **real** observatory data, just upload any `.fits` file in the app.
