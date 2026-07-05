# AstroVision — API Reference

Base URL: `http://localhost:8000` · All routes are prefixed with `/api`.
Interactive OpenAPI docs are served at `/docs`.

All error responses share one envelope:

```json
{ "error": { "code": "invalid_fits", "message": "Human-readable message." } }
```

Common codes: `unsupported_file` (415), `file_too_large` (413), `invalid_fits` (422),
`image_not_found` (404), `processing_error` (400), `validation_error` (422), `internal_error` (500).

---

## `GET /api/health`

Liveness/readiness probe.

```json
{ "status": "ok", "service": "AstroVision API", "version": "0.1.0" }
```

---

## `POST /api/upload`

Upload a FITS file (`multipart/form-data`, field `file`). Accepts `.fits`, `.fit`, `.fts`,
`.fits.gz`. Returns the full **ImagePayload**.

**ImagePayload**

```jsonc
{
  "id": "4ecf3a25…",              // use this id for /process and /star-detection
  "filename": "M31.fits",
  "width": 640,
  "height": 512,
  "image": "data:image/png;base64,iVBOR…",   // display-stretched render
  "metadata": {
    "telescope": "…", "instrument": "…", "exposure_time": 600.0,
    "observation_date": "2024-10-18T22:41:30", "object_name": "M31 (Andromeda Galaxy)",
    "filter": "L", "width": 640, "height": 512, "bit_depth": 32,
    "header": [ { "keyword": "SIMPLE", "value": "True", "comment": "" }, … ]
  },
  "statistics": {
    "mean": 353.3, "median": 301.9, "minimum": 223.0, "maximum": 12252.3,
    "std_dev": 372.8, "variance": 139000.2, "dynamic_range": 12029.2
  },
  "histogram": { "bins": [/* len n+1 edges */], "counts": [/* len n */] }
}
```

---

## `GET /api/samples`

List bundled sample datasets.

```jsonc
{
  "samples": [
    { "id": "horsehead", "name": "Horsehead Nebula", "description": "…",
      "filename": "HorseHead.fits", "size": "1.0 MB", "category": "Nebula" },
    …
  ]
}
```

## `POST /api/samples/{sample_id}/open`

Open a bundled sample by id. Returns the same **ImagePayload** as `/upload`.

---

## `POST /api/process`

Apply an **ordered** pipeline of operations to a loaded image. An empty `operations` array resets to
the original render. Operations are applied to the display-stretched image in the order given.

**Request**

```jsonc
{
  "image_id": "4ecf3a25…",
  "operations": [
    { "type": "brightness", "params": { "value": 0.1 } },   // additive, ~[-0.5, 0.5]
    { "type": "contrast",   "params": { "value": 1.3 } },   // multiplicative around mid-grey
    { "type": "gamma",      "params": { "value": 1.8 } },
    { "type": "gaussian_blur", "params": { "sigma": 2.0 } },
    { "type": "median_filter", "params": { "size": 3 } },
    { "type": "sharpen",    "params": { "amount": 1.0 } },
    { "type": "canny",      "params": { "low": 50, "high": 150 } }
  ]
}
```

Supported `type` values: `brightness`, `contrast`, `gamma`, `normalize`, `invert`,
`gaussian_blur`, `median_filter`, `sharpen`, `sobel`, `laplacian`, `canny`.

**Response** (statistics/histogram reported on the 0–255 display scale)

```jsonc
{ "image": "data:image/png;base64,…", "statistics": { … }, "histogram": { … } }
```

---

## `POST /api/star-detection`

Detect point sources with Photutils `DAOStarFinder`.

**Request**

```jsonc
{
  "image_id": "4ecf3a25…",
  "threshold_sigma": 5.0,   // detection threshold in σ above background (1–50)
  "fwhm": 3.0,              // expected PSF FWHM in px (1–20)
  "max_stars": 500          // cap on returned sources, brightest first (1–5000)
}
```

**Response** — `count` is the total detected; `stars` is capped at `max_stars`. Coordinates use a
top-left origin matching the rendered PNG.

```jsonc
{
  "count": 747,
  "stars": [
    { "x": 53.01, "y": 266.92, "flux": 65734.7, "peak": 11951.8, "sharpness": 0.58 },
    …
  ]
}
```
