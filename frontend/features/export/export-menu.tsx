"use client";

import { Braces, Download, FileImage, FileSpreadsheet, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAstroStore } from "@/hooks/use-astro-store";
import {
  exportHistogramCsv,
  exportJpeg,
  exportMetadataJson,
  exportPng,
  exportStatisticsCsv,
} from "@/utils/export";

/** Export dialog offering PNG/JPEG renders and CSV/JSON data downloads. */
export function ExportMenu() {
  const image = useAstroStore((s) => s.image);
  const displaySrc = useAstroStore((s) => s.displaySrc);
  const processedStats = useAstroStore((s) => s.processedStats);
  const processedHistogram = useAstroStore((s) => s.processedHistogram);

  if (!image || !displaySrc) return null;

  const stats = processedStats ?? image.statistics;
  const histogram = processedHistogram ?? image.histogram;

  const options = [
    {
      icon: ImageIcon,
      label: "PNG image",
      description: "Current render, lossless",
      action: () => exportPng(displaySrc, image),
    },
    {
      icon: FileImage,
      label: "JPEG image",
      description: "Current render, compressed",
      action: () => exportJpeg(displaySrc, image),
    },
    {
      icon: FileSpreadsheet,
      label: "Statistics (CSV)",
      description: "Mean, median, std-dev…",
      action: () => exportStatisticsCsv(stats, image),
    },
    {
      icon: FileSpreadsheet,
      label: "Histogram (CSV)",
      description: "Bin edges and counts",
      action: () => exportHistogramCsv(histogram, image),
    },
    {
      icon: Braces,
      label: "Metadata (JSON)",
      description: "Full FITS header",
      action: () => exportMetadataJson(image),
    },
  ];

  const run = async (action: () => void | Promise<void>, label: string) => {
    try {
      await action();
      toast.success(`Exported ${label}`);
    } catch {
      toast.error(`Failed to export ${label}`);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" /> Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>
            Download the current view and analysis results.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <button
              key={option.label}
              onClick={() => run(option.action, option.label)}
              className="glass flex items-center gap-3 rounded-lg p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <option.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{option.label}</p>
                <p className="truncate text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
