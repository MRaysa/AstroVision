/** Client-side export helpers: trigger browser downloads from in-memory data. */

import type { Histogram, ImagePayload, Statistics } from "@/types/api";

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadText(content: string, filename: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

/** Base filename without extension, derived from the source FITS name. */
function baseName(image: ImagePayload): string {
  return image.filename.replace(/\.(fits|fit|fts)(\.gz)?$/i, "") || "astrovision";
}

/** Download the currently displayed render as a PNG. */
export function exportPng(dataUrl: string, image: ImagePayload): void {
  triggerDownload(dataUrl, `${baseName(image)}.png`);
}

/** Re-encode the current render to JPEG on a canvas, then download it. */
export function exportJpeg(dataUrl: string, image: ImagePayload): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      triggerDownload(canvas.toDataURL("image/jpeg", 0.92), `${baseName(image)}.jpg`);
      resolve();
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

/** Download statistics as a two-column CSV. */
export function exportStatisticsCsv(stats: Statistics, image: ImagePayload): void {
  const rows: [string, number][] = [
    ["mean", stats.mean],
    ["median", stats.median],
    ["minimum", stats.minimum],
    ["maximum", stats.maximum],
    ["std_dev", stats.std_dev],
    ["variance", stats.variance],
    ["dynamic_range", stats.dynamic_range],
  ];
  const csv = ["metric,value", ...rows.map(([k, v]) => `${k},${v}`)].join("\n");
  downloadText(csv, `${baseName(image)}_statistics.csv`, "text/csv");
}

/** Download the histogram (bin edges + counts) as CSV. */
export function exportHistogramCsv(histogram: Histogram, image: ImagePayload): void {
  const { bins, counts } = histogram;
  const lines = ["bin_start,bin_end,count"];
  for (let i = 0; i < counts.length; i += 1) {
    lines.push(`${bins[i]},${bins[i + 1]},${counts[i]}`);
  }
  downloadText(lines.join("\n"), `${baseName(image)}_histogram.csv`, "text/csv");
}

/** Download the full metadata (curated fields + header) as JSON. */
export function exportMetadataJson(image: ImagePayload): void {
  const json = JSON.stringify({ filename: image.filename, ...image.metadata }, null, 2);
  downloadText(json, `${baseName(image)}_metadata.json`, "application/json");
}
