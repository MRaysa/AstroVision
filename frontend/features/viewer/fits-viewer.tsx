"use client";

import {
  Crosshair,
  Expand,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAstroStore } from "@/hooks/use-astro-store";
import { cn } from "@/utils/cn";

const MIN_SCALE = 0.1;
const MAX_SCALE = 40;
const ZOOM_STEP = 1.2;

interface Cursor {
  x: number;
  y: number;
  value: number | null;
}

/**
 * Interactive canvas-style viewer for the rendered FITS image.
 * Supports wheel-zoom (toward the cursor), drag-to-pan, reset, fullscreen,
 * live pixel coordinates + intensity readout, and a star-detection overlay.
 */
export function FitsViewer() {
  const image = useAstroStore((s) => s.image);
  const displaySrc = useAstroStore((s) => s.displaySrc);
  const stars = useAstroStore((s) => s.stars);
  const showStars = useAstroStore((s) => s.showStars);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pixelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // The pan/zoom transform is kept as a single object so it can be updated
  // atomically in one pure state updater (nesting one setter inside another is
  // unsafe under React StrictMode and caused the image to drift while zooming).
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const width = image?.width ?? 0;
  const height = image?.height ?? 0;

  /** Center and fit the image within the container. */
  const fitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container || !width || !height) return;
    const { clientWidth, clientHeight } = container;
    const fit = Math.min(clientWidth / width, clientHeight / height) * 0.92;
    const nextScale = Math.max(MIN_SCALE, Math.min(fit, MAX_SCALE));
    setView({
      scale: nextScale,
      x: (clientWidth - width * nextScale) / 2,
      y: (clientHeight - height * nextScale) / 2,
    });
  }, [width, height]);

  // Fit whenever a new image loads.
  useEffect(() => {
    if (isReady) fitToView();
  }, [isReady, fitToView]);

  // Build an offscreen canvas from the display image to read pixel intensities.
  useEffect(() => {
    if (!displaySrc) return;
    setIsReady(false);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx?.drawImage(img, 0, 0);
      pixelCanvasRef.current = canvas;
      setIsReady(true);
    };
    img.src = displaySrc;
  }, [displaySrc]);

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // Anchor point (container-relative): the cursor for wheel zoom, or the
      // container centre for the toolbar buttons.
      const cx = (clientX ?? rect.left + rect.width / 2) - rect.left;
      const cy = (clientY ?? rect.top + rect.height / 2) - rect.top;
      setView((v) => {
        const next = Math.max(MIN_SCALE, Math.min(v.scale * factor, MAX_SCALE));
        const ratio = next / v.scale;
        // Keep the anchor point fixed on screen while scaling.
        return { scale: next, x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio };
      });
    },
    [],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      zoomAt(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, e.clientX, e.clientY);
    },
    [zoomAt],
  );

  const readPixel = useCallback(
    (imgX: number, imgY: number): number | null => {
      const canvas = pixelCanvasRef.current;
      if (!canvas || imgX < 0 || imgY < 0 || imgX >= canvas.width || imgY >= canvas.height)
        return null;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const data = ctx?.getImageData(imgX, imgY, 1, 1).data;
      return data ? data[0] : null; // grayscale render → R channel
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      if (isPanning) {
        setView((v) => ({
          ...v,
          x: panStart.current.ox + (e.clientX - panStart.current.x),
          y: panStart.current.oy + (e.clientY - panStart.current.y),
        }));
        return;
      }

      const imgX = Math.floor((e.clientX - rect.left - view.x) / view.scale);
      const imgY = Math.floor((e.clientY - rect.top - view.y) / view.scale);
      if (imgX >= 0 && imgY >= 0 && imgX < width && imgY < height) {
        setCursor({ x: imgX, y: imgY, value: readPixel(imgX, imgY) });
      } else {
        setCursor(null);
      }
    },
    [isPanning, view, width, height, readPixel],
  );

  const startPan = useCallback(
    (e: React.PointerEvent) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y };
    },
    [view],
  );

  const endPan = useCallback((e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    setIsPanning(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const starRadius = useMemo(() => Math.max(4, Math.min(width, height) / 90), [width, height]);

  if (!image || !displaySrc) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden rounded-xl border border-border/60 bg-[#04070f] select-none",
        isPanning ? "cursor-grabbing" : "cursor-grab",
        isFullscreen && "rounded-none",
      )}
      onWheel={handleWheel}
      onPointerDown={startPan}
      onPointerMove={handlePointerMove}
      onPointerUp={endPan}
      onPointerLeave={(e) => {
        endPan(e);
        setCursor(null);
      }}
    >
      {/* subtle grid backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,0.4)_100%)]" />

      {!isReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Transformed image + overlay */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        <img
          ref={imgRef}
          src={displaySrc}
          alt={image.filename}
          width={width}
          height={height}
          draggable={false}
          className="max-w-none [image-rendering:pixelated]"
        />
        {showStars && stars.length > 0 && (
          <svg
            className="pointer-events-none absolute left-0 top-0"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
          >
            {stars.map((star, i) => (
              <circle
                key={i}
                cx={star.x}
                cy={star.y}
                r={starRadius}
                fill="none"
                stroke="#38f5c8"
                strokeWidth={Math.max(1, starRadius / 4)}
                opacity={0.9}
              />
            ))}
          </svg>
        )}
      </div>

      {/* Toolbar */}
      <TooltipProvider delayDuration={200}>
        <div className="absolute right-3 top-3 z-30 flex flex-col gap-1.5">
          <ViewerButton label="Zoom in" onClick={() => zoomAt(ZOOM_STEP)}>
            <Plus className="h-4 w-4" />
          </ViewerButton>
          <ViewerButton label="Zoom out" onClick={() => zoomAt(1 / ZOOM_STEP)}>
            <Minus className="h-4 w-4" />
          </ViewerButton>
          <ViewerButton label="Reset view" onClick={fitToView}>
            <RotateCcw className="h-4 w-4" />
          </ViewerButton>
          <ViewerButton label={isFullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
            {isFullscreen ? <Maximize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </ViewerButton>
        </div>
      </TooltipProvider>

      {/* Status bar */}
      <div className="absolute bottom-3 left-3 z-30 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 font-mono">
          <Crosshair className="h-3 w-3" />
          {cursor ? `X ${cursor.x}  Y ${cursor.y}` : "X —  Y —"}
        </Badge>
        <Badge variant="secondary" className="font-mono" title="Display intensity (0–255)">
          I {cursor?.value ?? "—"}
        </Badge>
        <Badge variant="outline" className="font-mono">
          {Math.round(view.scale * 100)}%
        </Badge>
      </div>
    </div>
  );
}

function ViewerButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 glass-strong"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}
