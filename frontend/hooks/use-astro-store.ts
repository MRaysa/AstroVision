/**
 * Global client state for the workspace, backed by Zustand.
 *
 * Holds the currently loaded image plus any derived view state (the image the
 * viewer should render, processed statistics, detected stars). Server data
 * fetching is handled separately by React Query.
 */

import { create } from "zustand";

import type { Histogram, ImagePayload, Star, Statistics } from "@/types/api";

interface AstroState {
  /** The loaded image with its original metadata, stats and histogram. */
  image: ImagePayload | null;
  /** The image source currently shown in the viewer (original or processed). */
  displaySrc: string | null;
  /** Whether a processing pipeline is currently applied. */
  isProcessed: boolean;
  /** Stats/histogram of the processed image, when different from the original. */
  processedStats: Statistics | null;
  processedHistogram: Histogram | null;

  /** Detected stars and overlay visibility. */
  stars: Star[];
  starCount: number;
  showStars: boolean;

  setImage: (image: ImagePayload) => void;
  clearImage: () => void;
  setProcessed: (src: string, stats: Statistics, histogram: Histogram) => void;
  resetProcessed: () => void;
  setStars: (stars: Star[], count: number) => void;
  clearStars: () => void;
  setShowStars: (value: boolean) => void;
}

export const useAstroStore = create<AstroState>((set, get) => ({
  image: null,
  displaySrc: null,
  isProcessed: false,
  processedStats: null,
  processedHistogram: null,
  stars: [],
  starCount: 0,
  showStars: false,

  setImage: (image) =>
    set({
      image,
      displaySrc: image.image,
      isProcessed: false,
      processedStats: null,
      processedHistogram: null,
      stars: [],
      starCount: 0,
      showStars: false,
    }),

  clearImage: () =>
    set({
      image: null,
      displaySrc: null,
      isProcessed: false,
      processedStats: null,
      processedHistogram: null,
      stars: [],
      starCount: 0,
      showStars: false,
    }),

  setProcessed: (src, stats, histogram) =>
    set({ displaySrc: src, isProcessed: true, processedStats: stats, processedHistogram: histogram }),

  resetProcessed: () => {
    const { image } = get();
    set({
      displaySrc: image?.image ?? null,
      isProcessed: false,
      processedStats: null,
      processedHistogram: null,
    });
  },

  setStars: (stars, count) => set({ stars, starCount: count, showStars: true }),
  clearStars: () => set({ stars: [], starCount: 0, showStars: false }),
  setShowStars: (value) => set({ showStars: value }),
}));
