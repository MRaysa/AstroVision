"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/services/api";

/** Fetch the list of bundled sample datasets. */
export function useSamples() {
  return useQuery({
    queryKey: ["samples"],
    queryFn: () => api.listSamples(),
    select: (data) => data.samples,
  });
}
