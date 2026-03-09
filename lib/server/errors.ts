import "server-only";

export class ApiError extends Error {
  status: number;

  code: string;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status ?? 500;
    this.code = options?.code ?? "internal_error";
  }
}

export function getErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "internal_error",
        message: "Unexpected server error.",
      },
    },
  };
}
