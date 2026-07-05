"use client";

import { ArrowLeftRight, ImagePlus, Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/services/api";
import { useSamples } from "@/hooks/use-samples";
import type { ImagePayload } from "@/types/api";
import { cn } from "@/utils/cn";

type Slot = "a" | "b";

/** Side-by-side comparison of two frames with a draggable reveal divider. */
export function ComparisonView() {
  const [a, setA] = useState<ImagePayload | null>(null);
  const [b, setB] = useState<ImagePayload | null>(null);
  const [split, setSplit] = useState(50);
  const [loading, setLoading] = useState<Slot | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const set = (slot: Slot, value: ImagePayload | null) => (slot === "a" ? setA(value) : setB(value));

  const loadSample = useCallback(async (slot: Slot, id: string) => {
    setLoading(slot);
    try {
      set(slot, await api.openSample(id));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load sample");
    } finally {
      setLoading(null);
    }
  }, []);

  const loadUpload = useCallback(async (slot: Slot, file: File) => {
    setLoading(slot);
    try {
      set(slot, await api.uploadFits(file));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to upload file");
    } finally {
      setLoading(null);
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplit(Math.max(0, Math.min(100, pct)));
  }, []);

  const bothLoaded = a && b;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SlotPicker slot="a" label="Image A" current={a} loading={loading === "a"} onSample={loadSample} onUpload={loadUpload} />
        <SlotPicker slot="b" label="Image B" current={b} loading={loading === "b"} onSample={loadSample} onUpload={loadUpload} />
      </div>

      <div
        ref={containerRef}
        className="relative aspect-video w-full select-none overflow-hidden rounded-xl border border-border/60 bg-[#04070f]"
        onPointerMove={onPointerMove}
        onPointerUp={() => (dragging.current = false)}
        onPointerLeave={() => (dragging.current = false)}
      >
        {!bothLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ArrowLeftRight className="h-8 w-8" />
            <p className="text-sm">Load two images to compare them side by side.</p>
          </div>
        )}

        {a && (
          <img
            src={a.image}
            alt={a.filename}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />
        )}
        {b && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${split}%)` }}
          >
            <img
              src={b.image}
              alt={b.filename}
              className="absolute inset-0 h-full w-full object-contain"
              draggable={false}
            />
          </div>
        )}

        {bothLoaded && (
          <>
            {/* Divider handle */}
            <div
              className="absolute inset-y-0 z-10 flex w-1 cursor-ew-resize items-center justify-center bg-accent"
              style={{ left: `${split}%`, transform: "translateX(-50%)" }}
              onPointerDown={(e) => {
                (e.target as Element).setPointerCapture?.(e.pointerId);
                dragging.current = true;
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            </div>
            <Badge variant="secondary" className="absolute left-3 top-3 font-mono">
              A · {a.filename}
            </Badge>
            <Badge variant="secondary" className="absolute right-3 top-3 font-mono">
              B · {b.filename}
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}

function SlotPicker({
  slot,
  label,
  current,
  loading,
  onSample,
  onUpload,
}: {
  slot: Slot;
  label: string;
  current: ImagePayload | null;
  loading: boolean;
  onSample: (slot: Slot, id: string) => void;
  onUpload: (slot: Slot, file: File) => void;
}) {
  const { data: samples } = useSamples();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="glass rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{label}</h3>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {current && !loading && (
          <span className="truncate font-mono text-xs text-muted-foreground">{current.filename}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className={cn(
            "h-9 flex-1 rounded-lg border border-input bg-background/50 px-2 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          value=""
          onChange={(e) => e.target.value && onSample(slot, e.target.value)}
        >
          <option value="">Choose a sample…</option>
          {samples?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" /> Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".fits,.fit,.fts,.gz"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onUpload(slot, e.target.files[0])}
        />
      </div>
    </div>
  );
}
