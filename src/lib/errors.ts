/**
 * Typed application errors and the single place they become HTTP responses.
 * Anything that is not an AppError is reported as INTERNAL with a generic
 * message, so database errors and stack traces never reach the browser.
 */
export const ERROR_CODES = {
  VALIDATION_FAILED: 400,
  BOT_CHECK_FAILED: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  OPPORTUNITY_CLOSED: 409,
  DUPLICATE_APPLICATION: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fieldErrors?: FieldErrors;
  readonly retryAfterSeconds?: number;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { fieldErrors?: FieldErrors; retryAfterSeconds?: number; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_CODES[code];
    this.fieldErrors = options?.fieldErrors;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

export type ErrorBody = {
  error: { code: ErrorCode; message: string; requestId: string; fieldErrors?: FieldErrors };
};

const GENERIC_MESSAGE = "Something went wrong on our side. Please try again shortly.";

export function toErrorResponse(err: unknown, requestId: string): { status: number; body: ErrorBody } {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: {
        error: {
          code: err.code,
          message: err.message,
          requestId,
          ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
        },
      },
    };
  }
  return {
    status: 500,
    body: { error: { code: "INTERNAL", message: GENERIC_MESSAGE, requestId } },
  };
}
