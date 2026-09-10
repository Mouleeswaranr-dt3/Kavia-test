const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  readonly code: string;
  readonly correlationId?: string;
  readonly details?: Array<Record<string, unknown>>;
  readonly status: number;

  constructor(
    message: string,
    status: number,
    code = "request_failed",
    correlationId?: string,
    details?: Array<Record<string, unknown>>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.correlationId = correlationId;
    this.details = details;
  }
}

function createCorrelationId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `enersight-${Date.now()}-${Math.random()}`;
}

function requestHeaders(headers?: HeadersInit): Headers {
  const result = new Headers(headers);
  result.set("X-Correlation-ID", createCorrelationId());

  // Development-only contract header; production identity integration must replace it.
  const subject = import.meta.env.VITE_EXTERNAL_SUBJECT;
  if (subject) {
    result.set("X-External-Subject", subject);
  }

  return result;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: requestHeaders(init.headers),
    });
  } catch {
    throw new ApiError("The request could not be completed. Please try again.", 0, "network_error");
  }

  const correlationId = response.headers.get("X-Correlation-ID") ?? undefined;
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const envelope = body as {
      code?: string;
      message?: string;
      correlation_id?: string;
      details?: Array<Record<string, unknown>>;
    } | null;

    throw new ApiError(
      envelope?.message ?? "The service could not complete the request.",
      response.status,
      envelope?.code ?? "request_failed",
      envelope?.correlation_id ?? correlationId,
      envelope?.details,
    );
  }

  if (body === null) {
    throw new ApiError("The service returned an unexpected response.", response.status, "malformed_response", correlationId);
  }

  return body as T;
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function postJson<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function postForm<T>(path: string, formData: FormData): Promise<T> {
  return request<T>(path, { method: "POST", body: formData });
}

export async function download(path: string): Promise<Blob> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers: requestHeaders() });
  } catch {
    throw new ApiError("The export could not be downloaded. Please try again.", 0, "network_error");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const envelope = body as { code?: string; message?: string; correlation_id?: string } | null;
    throw new ApiError(
      envelope?.message ?? "The export could not be downloaded.",
      response.status,
      envelope?.code ?? "download_failed",
      envelope?.correlation_id ?? response.headers.get("X-Correlation-ID") ?? undefined,
    );
  }

  return response.blob();
}
