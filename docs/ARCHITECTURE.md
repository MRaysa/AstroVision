# AstroVision — Architecture

## Overview

AstroVision is a two-tier application with a strict separation of concerns:

- **Frontend (Next.js)** handles presentation and interaction only. It never parses FITS files.
- **Backend (FastAPI)** owns all scientific computation: FITS parsing, header extraction,
  statistics, histograms, rendering, image processing, edge detection and star detection.

The two communicate over a small, typed JSON/HTTP API. Rendered images are returned as base64 PNG
data URLs, so the browser can display them without any binary handling or CORS-tainted canvases.

```
 User ──▶ Next.js (Vercel) ──HTTP──▶ FastAPI (Railway/Render) ──▶ Astropy / NumPy / SciPy / OpenCV / Photutils
                 ▲                              │
                 └────── JSON + base64 PNG ─────┘
```

## Backend design

### Layers

```
api/        HTTP routing + request validation (thin)
  routes/   one module per resource (upload, process, stars, samples, health)
  helpers   shared "load + build payload" orchestration
core/       configuration (pydantic-settings) and error handling
services/   the domain logic — pure functions over numpy arrays + a small state store
schemas/    Pydantic models = the single source of truth for the API contract
utils/      encoding helpers (array → PNG data URL)
```

Routes stay thin: they validate input, call a service, and return a schema object. All real work
lives in `services/`, which is framework-agnostic and unit-testable.

### Key services

- **`fits_service`** — the only module that imports Astropy. Loads bytes into a sanitised 2-D
  float32 array (collapsing cubes, replacing NaN/inf), extracts a curated metadata subset plus the
  full header, computes statistics and a percentile-clipped histogram, and renders a display image
  using a **ZScale interval + asinh stretch** (the standard for showing faint structure alongside
  bright stars).
- **`processing_service`** — an ordered pipeline of operations applied to the display image. Empty
  pipeline = reset. Adjustments (brightness/contrast/gamma) and filters use NumPy/SciPy; edge
  detectors use OpenCV.
- **`star_service`** — estimates a sigma-clipped background and runs Photutils `DAOStarFinder`,
  returning source coordinates (flipped to a top-left origin to match the rendered PNG).
- **`store`** — a thread-safe, LRU-bounded in-memory cache of loaded frames keyed by a generated
  image id. This lets the client issue many processing calls against one upload without re-sending
  the file. It is intentionally process-local for the MVP (see roadmap for scaling it out).

### Error handling

Domain errors (`InvalidFitsError`, `UnsupportedFileError`, `ImageNotFoundError`, …) subclass a
common base and are mapped by a single exception handler to a consistent envelope:

```json
{ "error": { "code": "invalid_fits", "message": "…" } }
```

The frontend's API client turns these into typed `ApiError`s and user-facing toasts.

## Frontend design

### State model

- **Server state** — TanStack **React Query** manages fetching/mutations (samples list, upload,
  process, star detection) with caching, loading and error states.
- **Client state** — a single **Zustand** store (`use-astro-store`) holds the loaded image, the
  currently displayed source (original vs processed), processed statistics/histogram, and detected
  stars + overlay visibility.

### Feature modules

Each feature is a self-contained folder under `features/` (viewer, metadata, statistics, histogram,
processing, stars, comparison, export, samples, upload, landing, workspace). Shared, generic UI
primitives (Button, Card, Slider, Tabs, Dialog, …) live in `components/ui`.

### The viewer

`features/viewer/fits-viewer.tsx` implements zoom (wheel, toward cursor), drag-to-pan, reset-to-fit,
fullscreen, a live coordinate/intensity status bar, and an SVG star overlay. Pixel intensity is read
from an offscreen canvas built from the display PNG (data URLs are same-origin, so `getImageData`
works without tainting).

## Data flow example — "open a sample, sharpen it, detect stars"

1. `GET /api/samples` populates the gallery (React Query).
2. Click → `POST /api/samples/starfield/open` → backend loads + caches the array, returns the full
   payload → stored in Zustand → workspace renders.
3. Move the Sharpen slider → debounced `POST /api/process` with an operations pipeline → processed
   PNG + stats + histogram replace the display.
4. Click "Detect Stars" → `POST /api/star-detection` → coordinates stored → SVG overlay drawn on the
   viewer.

## Testing & verification

- **Backend:** `pytest` exercises every endpoint, all processing operations, star detection and the
  error paths (unsupported file, corrupt FITS, unknown id).
- **Frontend:** `tsc --noEmit`, `next lint` and a production `next build`. The full flow was also
  driven end-to-end in a real browser (upload/open → view → process → detect → overlay).
