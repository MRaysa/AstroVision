"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { useAstroStore } from "@/hooks/use-astro-store";
import type { Statistics } from "@/types/api";
import { formatNumber } from "@/utils/format";

const FIELDS: { key: keyof Statistics; label: string }[] = [
  { key: "mean", label: "Mean" },
  { key: "median", label: "Median" },
  { key: "minimum", label: "Minimum" },
  { key: "maximum", label: "Maximum" },
  { key: "std_dev", label: "Std Dev" },
  { key: "variance", label: "Variance" },
  { key: "dynamic_range", label: "Dynamic Range" },
];

/** Bottom panel: descriptive statistics rendered as compact cards. */
export function StatisticsPanel() {
  const image = useAstroStore((s) => s.image);
  const processedStats = useAstroStore((s) => s.processedStats);
  const isProcessed = useAstroStore((s) => s.isProcessed);

  const stats = processedStats ?? image?.statistics;
  if (!stats) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Statistics
        </h2>
        {isProcessed && <Badge variant="accent">processed</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
        {FIELDS.map((field, i) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
            className="glass rounded-lg p-3"
          >
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {field.label}
            </p>
            <p className="mt-1 truncate font-mono text-sm font-semibold" title={String(stats[field.key])}>
              {formatNumber(stats[field.key])}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
