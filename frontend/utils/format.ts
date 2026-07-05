/** Small formatting helpers shared across statistics and metadata panels. */

/** Format a number for scientific display, switching to exponent notation for
 *  very large / very small magnitudes. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e6 || abs < 1e-3)) return value.toExponential(3);
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

/** Format an exposure time in seconds into a compact, human string. */
export function formatExposure(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  return `${seconds.toLocaleString(undefined, { maximumFractionDigits: 2 })} s`;
}

/** Best-effort formatting of an ISO-ish observation date. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
