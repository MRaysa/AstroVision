<div align="center">

# 🔭 AstroVision

**A lightweight astronomy research tool for viewing, analyzing and processing astronomical FITS images — in the browser.**

Built with Next.js 15 · React 19 · FastAPI · Astropy · Photutils · OpenCV

</div>

---

AstroVision is a modern web application for inspecting astronomical **FITS** images. It is not a
generic image viewer — it models the workflow of professional astronomy software: load a frame,
read its header metadata, examine statistics and the intensity histogram, apply scientific image
processing and edge detection, and detect stars with Photutils. All heavy lifting happens on a
Python/FastAPI backend; the frontend never parses FITS itself.

## ✨ Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Landing page** | Introduction, feature overview, upload and one-click sample datasets. |
| 2 | **Upload FITS** | Drag-and-drop `.fits` upload with validation and friendly errors. |
| 3 | **Sample datasets** | Bundled Horsehead, M31, Moon, Galaxy and Star-field frames, opened in one click. |
| 4 | **Interactive viewer** | Zoom, pan, reset, fullscreen, live pixel coordinates and intensity readout. |
| 5 | **Metadata panel** | Telescope, instrument, exposure, filter, dimensions, bit depth + searchable full header. |
| 6 | **Statistics** | Mean, median, min, max, std-dev, variance and dynamic range as cards. |
| 7 | **Histogram** | Interactive, zoomable intensity histogram (drag the brush to zoom). |
| 8 | **Image processing** | Brightness, contrast, gamma, normalize, invert, Gaussian blur, median, sharpen, reset. |
| 9 | **Edge detection** | Sobel, Laplacian and Canny operators (OpenCV). |
| 10 | **Star detection** | Photutils DAOFIND — detect, count and overlay stellar sources. |
| 11 | **Comparison view** | Load two frames and drag a divider to compare them. |
| 12 | **Export** | PNG / JPEG renders, statistics CSV, histogram CSV and metadata JSON. |

A **dark/light**, glassmorphic UI inspired by NASA / ESA control rooms and VS Code, with subtle
animation throughout.

## 🧱 Tech stack

**Frontend** — Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui-style
components (Radix), Lucide icons, TanStack React Query, Zustand, Framer Motion, Recharts.

**Backend** — Python 3.11+, FastAPI, Astropy, NumPy, SciPy, OpenCV, Photutils, Pillow, Matplotlib.

## 🏗️ Architecture

```
┌─────────────────────────────┐         HTTP / JSON          ┌──────────────────────────────┐
│         Frontend            │  ───────────────────────────▶ │           Backend            │
│   Next.js 15 · React 19     │   POST /api/upload            │      FastAPI (Python)        │
│                             │   POST /api/process           │                              │
│  • Viewer (zoom/pan/coords) │   POST /api/star-detection    │  • Astropy  → load + header  │
│  • Metadata / Stats / Hist  │   GET  /api/samples           │  • NumPy    → statistics     │
│  • Processing / Stars / etc │ ◀───────────────────────────  │  • SciPy/CV → filters/edges  │
│                             │   base64 PNG + JSON payloads  │  • Photutils→ star detection │
│  React Query · Zustand      │                               │  • Pillow   → PNG rendering  │
└─────────────────────────────┘                               └──────────────────────────────┘
       (never parses FITS)                                       (all FITS processing here)
```

The frontend sends files/commands and renders JSON + base64 PNGs. The backend owns **all** FITS
parsing and image computation, keeping the client light and portable. Loaded frames are cached
in-memory (LRU) on the backend keyed by an image id, so repeated processing calls avoid re-uploads.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/API.md`](docs/API.md) for detail.

## 📂 Project structure

```
astrovision/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI routers (upload, process, stars, samples, health)
│   │   ├── core/          # config + error handling
│   │   ├── services/      # FITS, processing, star-detection, sample & image-store logic
│   │   ├── schemas/       # Pydantic request/response models (the API contract)
│   │   ├── utils/         # array → PNG encoding helpers
│   │   └── main.py        # app factory + CORS
│   ├── scripts/           # generate_samples.py
│   ├── sample_data/       # generated sample FITS files
│   ├── tests/             # pytest API tests
│   └── requirements.txt
├── frontend/
│   ├── app/               # App Router pages: /, /workspace, /compare
│   ├── components/        # UI primitives + shared components
│   ├── features/          # feature modules (viewer, metadata, processing, stars, …)
│   ├── hooks/             # Zustand store + React Query data hooks
│   ├── services/          # typed API client
│   ├── types/             # shared TypeScript types (mirror backend schemas)
│   └── utils/             # formatting, class-name and export helpers
├── docs/                  # architecture + API documentation
└── README.md
```

## 🚀 Getting started

### Prerequisites

- **Python** 3.11+ and **Node.js** 18+ (tested on Python 3.13 / Node 24).

### 1 · Backend

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate      macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt

# Generate the bundled sample FITS files (one time):
python scripts/generate_samples.py

# Run the API (docs at http://localhost:8000/docs):
uvicorn app.main:app --reload
```

The API listens on **http://localhost:8000**. Configuration is optional — copy `.env.example` to
`.env` to override CORS origins, upload limits, etc.

### 2 · Frontend

```bash
cd frontend
npm install
cp .env.example .env.local           # sets NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open **http://localhost:3000**.

### Tests & quality

```bash
# Backend
cd backend && pytest                  # 20 API tests
ruff check .                          # lint

# Frontend
cd frontend
npm run typecheck                     # tsc --noEmit
npm run lint                          # next lint
npm run build                         # production build
```

## 🛰️ API summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/upload` | Upload a FITS file → image, metadata, statistics, histogram |
| `POST` | `/api/process` | Apply an ordered processing pipeline → processed image + stats + histogram |
| `POST` | `/api/star-detection` | Detect stars → count + coordinates |
| `GET`  | `/api/samples` | List bundled sample datasets |
| `POST` | `/api/samples/{id}/open` | Open a sample (same payload as upload) |
| `GET`  | `/api/health` | Health check |

Full request/response schemas: [`docs/API.md`](docs/API.md) or the live OpenAPI docs at `/docs`.

## 🖼️ Sample data

The bundled samples are **synthesised** (seeded, reproducible) rather than vendored, so the repo
stays small while still exercising every feature — a nebula with a dark silhouette, an inclined
galaxy disk, cratered lunar terrain, a spiral galaxy, and a dense star field for the detector. They
carry representative FITS headers (telescope, instrument, exposure, filter, date). Regenerate them
any time with `python scripts/generate_samples.py`. To use real observatory data, just upload any
`.fits` file.

## ☁️ Deployment

- **Frontend → Vercel.** Set `NEXT_PUBLIC_API_URL` to your deployed backend URL.
- **Backend → Railway / Render.** Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
  Set `ASTROVISION_CORS_ORIGINS` to your Vercel URL. Run `scripts/generate_samples.py` at build time.

## 🗺️ Future roadmap

Deliberately **out of scope** for this MVP, but natural next steps:

- AI galaxy classification & exoplanet (transit) detection
- Spectral analysis and WCS (sky-coordinate) visualization
- Batch processing and annotation tools
- A plugin system for custom analysis steps
- User authentication, cloud storage and an observation scheduler

## 📄 License

Released under the MIT License — free to use as a portfolio and learning reference.
