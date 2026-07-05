"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAstroStore } from "@/hooks/use-astro-store";
import type { Metadata } from "@/types/api";
import { formatDate, formatExposure } from "@/utils/format";

/** Right-hand panel: curated metadata summary + searchable full header table. */
export function MetadataPanel() {
  const image = useAstroStore((s) => s.image);
  const [query, setQuery] = useState("");

  const metadata = image?.metadata;

  const filteredHeader = useMemo(() => {
    if (!metadata) return [];
    const q = query.trim().toLowerCase();
    if (!q) return metadata.header;
    return metadata.header.filter(
      (card) =>
        card.keyword.toLowerCase().includes(q) ||
        card.value.toLowerCase().includes(q) ||
        card.comment.toLowerCase().includes(q),
    );
  }, [metadata, query]);

  if (!metadata) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Metadata
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-2">
          <MetaRow label="Object" value={metadata.object_name} />
          <MetaRow label="Telescope" value={metadata.telescope} />
          <MetaRow label="Instrument" value={metadata.instrument} />
          <MetaRow label="Filter" value={metadata.filter} />
          <MetaRow label="Exposure" value={formatExposure(metadata.exposure_time)} />
          <MetaRow label="Date" value={formatDate(metadata.observation_date)} />
          <MetaRow label="Dimensions" value={`${metadata.width} × ${metadata.height} px`} />
          <MetaRow label="Bit depth" value={`${metadata.bit_depth}-bit`} />
        </dl>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          FITS Header
        </h3>
        <Badge variant="secondary">{filteredHeader.length}</Badge>
      </div>

      <div className="relative px-4 pt-3">
        <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search keywords…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="mt-3 flex-1 px-4 pb-4">
        <table className="w-full text-xs">
          <tbody>
            {filteredHeader.map((card, i) => (
              <tr key={`${card.keyword}-${i}`} className="border-b border-border/40 last:border-0">
                <td className="py-1.5 pr-2 align-top font-mono font-medium text-primary">
                  {card.keyword}
                </td>
                <td className="max-w-[9rem] break-words py-1.5 align-top font-mono">
                  {card.value || "—"}
                </td>
              </tr>
            ))}
            {filteredHeader.length === 0 && (
              <tr>
                <td className="py-4 text-center text-muted-foreground" colSpan={2}>
                  No matching keywords.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium" title={value ?? undefined}>
        {value || "—"}
      </dd>
    </div>
  );
}
