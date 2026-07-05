/**
 * TypeScript mirrors of the FastAPI response/request schemas.
 * Keep this file in sync with `backend/app/schemas`.
 */

export interface HeaderCard {
  keyword: string;
  value: string;
  comment: string;
}

export interface Metadata {
  telescope: string | null;
  instrument: string | null;
  exposure_time: number | null;
  observation_date: string | null;
  object_name: string | null;
  filter: string | null;
  width: number;
  height: number;
  bit_depth: number;
  header: HeaderCard[];
}

export interface Statistics {
  mean: number;
  median: number;
  minimum: number;
  maximum: number;
  std_dev: number;
  variance: number;
  dynamic_range: number;
}

export interface Histogram {
  bins: number[];
  counts: number[];
}

export interface ImagePayload {
  id: string;
  filename: string;
  width: number;
  height: number;
  image: string; // base64 PNG data URL
  metadata: Metadata;
  statistics: Statistics;
  histogram: Histogram;
}

export interface SampleImage {
  id: string;
  name: string;
  description: string;
  filename: string;
  size: string;
  category: string;
}

export interface SampleList {
  samples: SampleImage[];
}

export type OperationType =
  | "brightness"
  | "contrast"
  | "gamma"
  | "normalize"
  | "invert"
  | "gaussian_blur"
  | "median_filter"
  | "sharpen"
  | "sobel"
  | "laplacian"
  | "canny";

export interface Operation {
  type: OperationType;
  params: Record<string, number>;
}

export interface ProcessRequest {
  image_id: string;
  operations: Operation[];
}

export interface ProcessResponse {
  image: string;
  statistics: Statistics;
  histogram: Histogram;
}

export interface StarDetectionRequest {
  image_id: string;
  threshold_sigma?: number;
  fwhm?: number;
  max_stars?: number;
}

export interface Star {
  x: number;
  y: number;
  flux: number;
  peak: number;
  sharpness: number | null;
}

export interface StarDetectionResponse {
  count: number;
  stars: Star[];
}

/** Error envelope returned by the backend for expected failures. */
export interface ApiErrorEnvelope {
  error: { code: string; message: string };
}
