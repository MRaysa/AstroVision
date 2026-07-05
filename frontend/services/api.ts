/**
 * Typed API client for the AstroVision backend.
 *
 * All network access flows through this module so components never construct
 * URLs or handle fetch details directly. Errors are normalised into
 * `ApiError` instances carrying the backend's error code + message.
 */

import type {
  ApiErrorEnvelope,
  ImagePayload,
  ProcessRequest,
  ProcessResponse,
  SampleList,
  StarDetectionRequest,
  StarDetectionResponse,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_PREFIX = "/api";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

function url(path: string): string {
  return `${API_URL}${API_PREFIX}${path}`;
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}`;
  let code = "http_error";
  try {
    const body = (await response.json()) as ApiErrorEnvelope;
    if (body?.error) {
      message = body.error.message;
      code = body.error.code;
    }
  } catch {
    /* non-JSON error body — keep the default message */
  }
  return new ApiError(message, code, response.status);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url(path), init);
  } catch {
    throw new ApiError(
      "Cannot reach the AstroVision backend. Make sure the API server is running.",
      "network_error",
      0,
    );
  }
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}

export const api = {
  /** Upload a FITS file and get its full payload. */
  uploadFits(file: File): Promise<ImagePayload> {
    const form = new FormData();
    form.append("file", file);
    return request<ImagePayload>("/upload", { method: "POST", body: form });
  },

  /** List bundled sample datasets. */
  listSamples(): Promise<SampleList> {
    return request<SampleList>("/samples");
  },

  /** Open a bundled sample by id. */
  openSample(sampleId: string): Promise<ImagePayload> {
    return request<ImagePayload>(`/samples/${sampleId}/open`, { method: "POST" });
  },

  /** Apply a processing pipeline to a loaded image. */
  process(body: ProcessRequest): Promise<ProcessResponse> {
    return request<ProcessResponse>("/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  /** Detect stars in a loaded image. */
  detectStars(body: StarDetectionRequest): Promise<StarDetectionResponse> {
    return request<StarDetectionResponse>("/star-detection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};
