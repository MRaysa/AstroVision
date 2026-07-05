"use client";

import { Sparkles, SlidersHorizontal } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessingPanel } from "@/features/processing/processing-panel";
import { StarPanel } from "@/features/stars/star-panel";

/** Left sidebar holding the processing and star-detection tool tabs. */
export function ToolsSidebar() {
  return (
    <Tabs defaultValue="process" className="flex h-full flex-col">
      <div className="p-3 pb-0">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="process">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Process
          </TabsTrigger>
          <TabsTrigger value="stars">
            <Sparkles className="h-3.5 w-3.5" /> Stars
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="process" className="mt-0 flex-1 overflow-y-auto p-4">
        <ProcessingPanel />
      </TabsContent>
      <TabsContent value="stars" className="mt-0 flex-1 overflow-y-auto p-4">
        <StarPanel />
      </TabsContent>
    </Tabs>
  );
}
