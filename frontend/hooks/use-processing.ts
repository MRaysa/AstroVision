"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, ApiError } from "@/services/api";
import type { Operation } from "@/types/api";

import { useAstroStore } from "./use-astro-store";

/**
 * Apply a processing pipeline to the currently loaded image and push the result
 * into the store. An empty pipeline resets to the original render.
 */
export function useProcessing() {
  const image = useAstroStore((s) => s.image);
  const setProcessed = useAstroStore((s) => s.setProcessed);
  const resetProcessed = useAstroStore((s) => s.resetProcessed);

  const mutation = useMutation({
    mutationFn: async (operations: Operation[]) => {
      if (!image) throw new ApiError("No image loaded.", "no_image", 0);
      return api.process({ image_id: image.id, operations });
    },
    onSuccess: (result, operations) => {
      if (operations.length === 0) {
        resetProcessed();
        return;
      }
      setProcessed(result.image, result.statistics, result.histogram);
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Processing failed.";
      toast.error("Processing failed", { description: message });
    },
  });

  return {
    apply: mutation.mutate,
    isProcessing: mutation.isPending,
  };
}
