import "server-only";

type ErrorDetails = Record<string, unknown> | undefined;

export class BackendError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ErrorDetails;

  constructor(message: string, options?: { status?: number; code?: string; details?: ErrorDetails }) {
    super(message);
    this.name = "BackendError";
    this.status = options?.status ?? 500;
    this.code = options?.code ?? "internal_error";
    this.details = options?.details;
  }
}

export class ApiError extends BackendError {
  constructor(message: string, options?: { status?: number; code?: string; details?: ErrorDetails }) {
    super(message, options);
    this.name = "ApiError";
  }
}

export function isBackendError(error: unknown): error is BackendError {
  return error instanceof BackendError;
}

function normalizeError(error: unknown): BackendError {
  if (isBackendError(error)) {
    return error;
  }

  return new BackendError("Unexpected server error.", {
    status: 500,
    code: "internal_error",
  });
}

export function getErrorResponse(error: unknown) {
  const normalized = normalizeError(error);

  return {
    status: normalized.status,
    body: {
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details ? { details: normalized.details } : {}),
      },
    },
  };
}

export function invariantServer(
  condition: unknown,
  message: string,
  options?: { status?: number; code?: string; details?: ErrorDetails },
): asserts condition {
  if (!condition) {
    throw new BackendError(message, options);
  }
}
