"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useAstroStore } from "@/hooks/use-astro-store";
import { useProcessing } from "@/hooks/use-processing";
import type { Operation, OperationType } from "@/types/api";
import { cn } from "@/utils/cn";

const DEFAULT_ADJUST = { brightness: 0, contrast: 1, gamma: 1 };

type FilterKind = "normalize" | "invert" | "gaussian_blur" | "median_filter" | "sharpen";
type EdgeKind = "sobel" | "laplacian" | "canny";

/** Left-panel tab: image adjustments, filters and edge detection. */
export function ProcessingPanel() {
  const { apply, isProcessing } = useProcessing();
  const resetProcessed = useAstroStore((s) => s.resetProcessed);
  const image = useAstroStore((s) => s.image);

  const [adjust, setAdjust] = useState(DEFAULT_ADJUST);
  const [filter, setFilter] = useState<FilterKind | null>(null);
  const [blurSigma, setBlurSigma] = useState(2);
  const [medianSize, setMedianSize] = useState(3);
  const [sharpenAmount, setSharpenAmount] = useState(1);
  const [edge, setEdge] = useState<EdgeKind | null>(null);
  const [canny, setCanny] = useState({ low: 50, high: 150 });

  // Reset all controls whenever a new image is loaded.
  useEffect(() => {
    setAdjust(DEFAULT_ADJUST);
    setFilter(null);
    setEdge(null);
  }, [image?.id]);

  const buildPipeline = useCallback((): Operation[] => {
    const ops: Operation[] = [];
    if (adjust.brightness !== 0) ops.push({ type: "brightness", params: { value: adjust.brightness } });
    if (adjust.contrast !== 1) ops.push({ type: "contrast", params: { value: adjust.contrast } });
    if (adjust.gamma !== 1) ops.push({ type: "gamma", params: { value: adjust.gamma } });

    if (filter === "gaussian_blur") ops.push({ type: "gaussian_blur", params: { sigma: blurSigma } });
    else if (filter === "median_filter") ops.push({ type: "median_filter", params: { size: medianSize } });
    else if (filter === "sharpen") ops.push({ type: "sharpen", params: { amount: sharpenAmount } });
    else if (filter) ops.push({ type: filter as OperationType, params: {} });

    if (edge === "canny") ops.push({ type: "canny", params: canny });
    else if (edge) ops.push({ type: edge as OperationType, params: {} });

    return ops;
  }, [adjust, filter, blurSigma, medianSize, sharpenAmount, edge, canny]);

  // Debounced auto-apply whenever any control changes.
  const pipeline = useMemo(buildPipeline, [buildPipeline]);
  const serialized = JSON.stringify(pipeline);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (pipeline.length === 0) resetProcessed();
      else apply(pipeline);
    }, 180);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  const reset = () => {
    setAdjust(DEFAULT_ADJUST);
    setFilter(null);
    setEdge(null);
  };

  const isDirty = serialized !== "[]";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Adjustments</h3>
          {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <Button variant="ghost" size="sm" onClick={reset} disabled={!isDirty}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      <ControlSlider
        label="Brightness"
        value={adjust.brightness}
        min={-0.5}
        max={0.5}
        step={0.02}
        display={adjust.brightness.toFixed(2)}
        onChange={(v) => setAdjust((a) => ({ ...a, brightness: v }))}
      />
      <ControlSlider
        label="Contrast"
        value={adjust.contrast}
        min={0.2}
        max={3}
        step={0.05}
        display={`${adjust.contrast.toFixed(2)}×`}
        onChange={(v) => setAdjust((a) => ({ ...a, contrast: v }))}
      />
      <ControlSlider
        label="Gamma"
        value={adjust.gamma}
        min={0.2}
        max={3}
        step={0.05}
        display={adjust.gamma.toFixed(2)}
        onChange={(v) => setAdjust((a) => ({ ...a, gamma: v }))}
      />

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-semibold">Filters</h3>
        <div className="grid grid-cols-2 gap-2">
          <ToggleButton active={filter === "normalize"} onClick={() => toggle(setFilter, "normalize", filter)}>
            Normalize
          </ToggleButton>
          <ToggleButton active={filter === "invert"} onClick={() => toggle(setFilter, "invert", filter)}>
            Invert
          </ToggleButton>
          <ToggleButton active={filter === "gaussian_blur"} onClick={() => toggle(setFilter, "gaussian_blur", filter)}>
            Gaussian Blur
          </ToggleButton>
          <ToggleButton active={filter === "median_filter"} onClick={() => toggle(setFilter, "median_filter", filter)}>
            Median
          </ToggleButton>
          <ToggleButton active={filter === "sharpen"} onClick={() => toggle(setFilter, "sharpen", filter)}>
            Sharpen
          </ToggleButton>
        </div>

        {filter === "gaussian_blur" && (
          <div className="mt-3">
            <ControlSlider label="Blur σ" value={blurSigma} min={0.5} max={8} step={0.5} display={blurSigma.toFixed(1)} onChange={setBlurSigma} />
          </div>
        )}
        {filter === "median_filter" && (
          <div className="mt-3">
            <ControlSlider label="Kernel size" value={medianSize} min={3} max={9} step={2} display={`${medianSize}px`} onChange={setMedianSize} />
          </div>
        )}
        {filter === "sharpen" && (
          <div className="mt-3">
            <ControlSlider label="Amount" value={sharpenAmount} min={0.2} max={3} step={0.1} display={`${sharpenAmount.toFixed(1)}×`} onChange={setSharpenAmount} />
          </div>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-semibold">Edge Detection</h3>
        <div className="grid grid-cols-3 gap-2">
          <ToggleButton active={edge === "sobel"} onClick={() => toggle(setEdge, "sobel", edge)}>
            Sobel
          </ToggleButton>
          <ToggleButton active={edge === "laplacian"} onClick={() => toggle(setEdge, "laplacian", edge)}>
            Laplacian
          </ToggleButton>
          <ToggleButton active={edge === "canny"} onClick={() => toggle(setEdge, "canny", edge)}>
            Canny
          </ToggleButton>
        </div>

        {edge === "canny" && (
          <div className="mt-3 space-y-3">
            <ControlSlider label="Low threshold" value={canny.low} min={0} max={255} step={5} display={String(canny.low)} onChange={(v) => setCanny((c) => ({ ...c, low: v }))} />
            <ControlSlider label="High threshold" value={canny.high} min={0} max={255} step={5} display={String(canny.high)} onChange={(v) => setCanny((c) => ({ ...c, high: v }))} />
          </div>
        )}
      </div>
    </div>
  );
}

function toggle<T extends string>(
  setter: (v: T | null) => void,
  value: T,
  current: T | null,
) {
  setter(current === value ? null : value);
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="font-mono text-xs">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-2 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-secondary/40 hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
