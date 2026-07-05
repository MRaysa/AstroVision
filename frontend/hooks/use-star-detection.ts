"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, ApiError } from "@/services/api";

import { useAstroStore } from "./use-astro-store";

interface DetectParams {
  threshold_sigma: number;
  fwhm: number;
}

/** Run Photutils star detection on the loaded image and store the results. */
export function useStarDetection() {
  const image = useAstroStore((s) => s.image);
  const setStars = useAstroStore((s) => s.setStars);

  const mutation = useMutation({
    mutationFn: async (params: DetectParams) => {
      if (!image) throw new ApiError("No image loaded.", "no_image", 0);
      return api.detectStars({ image_id: image.id, ...params });
    },
    onSuccess: (result) => {
      setStars(result.stars, result.count);
      toast.success(`Detected ${result.count.toLocaleString()} stars`);
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Star detection failed.";
      toast.error("Star detection failed", { description: message });
    },
  });

  return {
    detect: mutation.mutate,
    isDetecting: mutation.isPending,
  };
}
