"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api, ApiError } from "@/services/api";
import type { ImagePayload } from "@/types/api";

import { useAstroStore } from "./use-astro-store";

/**
 * Load an image either from an uploaded file or a bundled sample, store it, and
 * navigate to the workspace. Surfaces friendly toast notifications on error.
 */
export function useImageLoader(options?: { navigate?: boolean }) {
  const navigate = options?.navigate ?? true;
  const router = useRouter();
  const setImage = useAstroStore((s) => s.setImage);

  const onSuccess = (payload: ImagePayload) => {
    setImage(payload);
    toast.success(`Loaded ${payload.filename}`, {
      description: `${payload.width} × ${payload.height} px`,
    });
    if (navigate) router.push("/workspace");
  };

  const onError = (error: unknown) => {
    const message =
      error instanceof ApiError ? error.message : "Something went wrong while loading the image.";
    toast.error("Could not load image", { description: message });
  };

  const uploadMutation = useMutation({ mutationFn: (file: File) => api.uploadFits(file), onSuccess, onError });
  const sampleMutation = useMutation({
    mutationFn: (sampleId: string) => api.openSample(sampleId),
    onSuccess,
    onError,
  });

  return {
    uploadFile: uploadMutation.mutate,
    openSample: sampleMutation.mutate,
    isLoading: uploadMutation.isPending || sampleMutation.isPending,
    loadingSampleId: sampleMutation.isPending ? (sampleMutation.variables as string) : null,
  };
}
