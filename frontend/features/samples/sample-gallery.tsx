"use client";

import { motion } from "framer-motion";
import { ArrowRight, ImageOff, Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useImageLoader } from "@/hooks/use-image-loader";
import { useSamples } from "@/hooks/use-samples";
import { cn } from "@/utils/cn";

interface SampleGalleryProps {
  navigate?: boolean;
  columns?: string;
}

/** Grid of one-click sample datasets. */
export function SampleGallery({
  navigate = true,
  columns = "sm:grid-cols-2 lg:grid-cols-3",
}: SampleGalleryProps) {
  const { data: samples, isLoading, isError } = useSamples();
  const { openSample, loadingSampleId } = useImageLoader({ navigate });

  if (isError) {
    return (
      <div className="glass flex flex-col items-center gap-2 rounded-xl p-8 text-center text-muted-foreground">
        <ImageOff className="h-6 w-6" />
        <p className="text-sm">
          Could not reach the backend to list samples. Is the API server running?
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 gap-4", columns)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-4", columns)}>
      {samples?.map((sample, index) => {
        const isBusy = loadingSampleId === sample.id;
        return (
          <motion.div
            key={sample.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
          >
            <Card
              role="button"
              tabIndex={0}
              onClick={() => openSample(sample.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") openSample(sample.id);
              }}
              className="group h-full cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="font-medium leading-tight">{sample.name}</h3>
                </div>
                <Badge variant="secondary">{sample.category}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {sample.description}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">{sample.size}</span>
                <span className="flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {isBusy ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Opening…
                    </>
                  ) : (
                    <>
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </span>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
