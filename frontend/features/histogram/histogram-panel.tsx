"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Brush,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAstroStore } from "@/hooks/use-astro-store";
import type { Histogram } from "@/types/api";
import { formatNumber } from "@/utils/format";

interface Point {
  intensity: number;
  count: number;
}

function toPoints(histogram: Histogram): Point[] {
  const { bins, counts } = histogram;
  return counts.map((count, i) => ({
    intensity: (bins[i] + bins[i + 1]) / 2,
    count,
  }));
}

/** Interactive, zoomable histogram of pixel intensities (drag the brush to zoom). */
export function HistogramPanel() {
  const image = useAstroStore((s) => s.image);
  const processedHistogram = useAstroStore((s) => s.processedHistogram);

  const histogram = processedHistogram ?? image?.histogram;
  const data = useMemo(() => (histogram ? toPoints(histogram) : []), [histogram]);

  if (!histogram) return null;

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Histogram
      </h2>
      <div className="min-h-[160px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="intensity"
              tickFormatter={(v) => formatNumber(v)}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              minTickGap={30}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              width={44}
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(v) => `Intensity: ${formatNumber(Number(v))}`}
              formatter={(value) => [formatNumber(Number(value)), "Pixels"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              fill="url(#histFill)"
              isAnimationActive={false}
            />
            <Brush
              dataKey="intensity"
              height={18}
              travellerWidth={8}
              stroke="hsl(var(--accent))"
              fill="hsl(var(--secondary))"
              tickFormatter={() => ""}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
