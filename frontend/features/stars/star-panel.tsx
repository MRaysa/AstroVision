"use client";

import { Eye, EyeOff, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAstroStore } from "@/hooks/use-astro-store";
import { useStarDetection } from "@/hooks/use-star-detection";

/** Left-panel tab: Photutils star detection controls and results. */
export function StarPanel() {
  const { detect, isDetecting } = useStarDetection();
  const starCount = useAstroStore((s) => s.starCount);
  const stars = useAstroStore((s) => s.stars);
  const showStars = useAstroStore((s) => s.showStars);
  const setShowStars = useAstroStore((s) => s.setShowStars);
  const clearStars = useAstroStore((s) => s.clearStars);

  const [threshold, setThreshold] = useState(5);
  const [fwhm, setFwhm] = useState(3);

  const hasResults = stars.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Star Detection</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Detect point sources with the DAOFIND algorithm (Photutils).
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Threshold (σ above background)</Label>
          <span className="font-mono text-xs">{threshold.toFixed(1)}</span>
        </div>
        <Slider value={[threshold]} min={1} max={20} step={0.5} onValueChange={([v]) => setThreshold(v)} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Star FWHM (px)</Label>
          <span className="font-mono text-xs">{fwhm.toFixed(1)}</span>
        </div>
        <Slider value={[fwhm]} min={1} max={10} step={0.5} onValueChange={([v]) => setFwhm(v)} />
      </div>

      <Button
        className="w-full"
        onClick={() => detect({ threshold_sigma: threshold, fwhm })}
        disabled={isDetecting}
      >
        {isDetecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Detecting…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Detect Stars
          </>
        )}
      </Button>

      {hasResults && (
        <>
          <Separator />
          <div className="glass rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-gradient">{starCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">stars detected</p>
            {stars.length < starCount && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                showing brightest {stars.length.toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showStars ? (
                <Eye className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Label className="text-sm">Show overlay</Label>
            </div>
            <Switch checked={showStars} onCheckedChange={setShowStars} />
          </div>

          <Button variant="outline" className="w-full" onClick={clearStars}>
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        </>
      )}
    </div>
  );
}
