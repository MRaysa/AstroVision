"use client";

import { FitsViewer } from "@/features/viewer/fits-viewer";
import { HistogramPanel } from "@/features/histogram/histogram-panel";
import { MetadataPanel } from "@/features/metadata/metadata-panel";
import { StatisticsPanel } from "@/features/statistics/statistics-panel";
import { WorkspaceEmptyState } from "@/features/workspace/empty-state";
import { ToolsSidebar } from "@/features/workspace/tools-sidebar";
import { WorkspaceHeader } from "@/features/workspace/workspace-header";
import { useAstroStore } from "@/hooks/use-astro-store";

export default function WorkspacePage() {
  const image = useAstroStore((s) => s.image);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <WorkspaceHeader />

      {!image ? (
        <div className="flex-1 overflow-y-auto">
          <WorkspaceEmptyState />
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 overflow-y-auto xl:grid-cols-[340px_1fr_360px] xl:overflow-hidden">
          {/* Left: tools */}
          <aside className="order-2 border-border/60 xl:order-1 xl:h-full xl:overflow-y-auto xl:border-r">
            <ToolsSidebar />
          </aside>

          {/* Center: viewer + bottom analysis panels */}
          <section className="order-1 flex min-h-0 flex-col xl:order-2 xl:overflow-hidden">
            <div className="min-h-[55vh] flex-1 p-3 xl:min-h-0">
              <FitsViewer />
            </div>
            <div className="shrink-0 space-y-4 border-t border-border/60 p-3">
              <StatisticsPanel />
              <div className="h-52">
                <HistogramPanel />
              </div>
            </div>
          </section>

          {/* Right: metadata */}
          <aside className="order-3 border-border/60 xl:h-full xl:overflow-y-auto xl:border-l">
            <MetadataPanel />
          </aside>
        </div>
      )}
    </div>
  );
}
