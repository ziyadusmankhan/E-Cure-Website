import "server-only";
import { ZodError } from "zod";

export type ErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAVAILABLE"
  | "CONFIGURATION"
  | "INTERNAL"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "VERIFICATION_FAILED"
  | "INVALID_DATE"
  | "SERVICE_UNAVAILABLE"
  | "BAD_REQUEST"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA"
  | "SUBMISSIONS_DISABLED";
const messages: Record<ErrorCode, string> = {
  INVALID_INPUT: "Please check the supplied information.",
  NOT_FOUND: "The requested record is unavailable.",
  CONFLICT: "The change conflicts with an existing record.",
  UNAVAILABLE: "The service is temporarily unavailable.",
  CONFIGURATION: "The backend is not configured for this operation.",
  INTERNAL: "The operation could not be completed.",
  FORBIDDEN: "This request is not permitted.",
  RATE_LIMITED: "Too many attempts. Please wait before trying again.",
  VERIFICATION_FAILED: "Please complete a fresh security check and try again.",
  INVALID_DATE:
    "Please choose an available future date and time preference in the business timezone.",
  SERVICE_UNAVAILABLE: "This service is not accepting requests. Please choose another service.",
  BAD_REQUEST: "The request could not be read. Please try again.",
  PAYLOAD_TOO_LARGE: "The request is too large. Please shorten your message.",
  UNSUPPORTED_MEDIA: "This request format is not supported.",
  SUBMISSIONS_DISABLED: "Online submissions are not enabled for this deployment.",
};
const statuses: Record<ErrorCode, number> = {
  INVALID_INPUT: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAVAILABLE: 503,
  CONFIGURATION: 503,
  INTERNAL: 500,
  FORBIDDEN: 403,
  RATE_LIMITED: 429,
  VERIFICATION_FAILED: 422,
  INVALID_DATE: 422,
  SERVICE_UNAVAILABLE: 422,
  BAD_REQUEST: 400,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA: 415,
  SUBMISSIONS_DISABLED: 503,
};
export class BackendError extends Error {
  readonly status: number;
  constructor(
    readonly code: ErrorCode,
    readonly retryAfter?: number,
  ) {
    super(messages[code]);
    this.name = "BackendError";
    this.status = statuses[code];
  }
}
function databaseCode(error: unknown): string | undefined {
  let current = error;
  for (let i = 0; i < 5 && current && typeof current === "object"; i++) {
    if ("code" in current && typeof current.code === "string") return current.code;
    current = "cause" in current ? current.cause : undefined;
  }
}
export function safeError(error: unknown): BackendError {
  if (error instanceof BackendError) return error;
  if (error instanceof ZodError) return new BackendError("INVALID_INPUT");
  const code = databaseCode(error);
  if (["23505", "23503", "23001"].includes(code ?? "")) return new BackendError("CONFLICT");
  if (code?.startsWith("22") || code === "23514" || code === "23502")
    return new BackendError("INVALID_INPUT");
  if (
    code?.startsWith("08") ||
    [
      "ECONNREFUSED",
      "ETIMEDOUT",
      "CONNECT_TIMEOUT",
      "CONNECTION_CLOSED",
      "57P01",
      "57P03",
      "53300",
      "57014",
      "55P03",
    ].includes(code ?? "")
  )
    return new BackendError("UNAVAILABLE");
  return new BackendError("INTERNAL");
}
export async function operation<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    throw safeError(error);
  }
}
export function publicError(error: unknown, requestId: string) {
  const safe = safeError(error);
  return {
    status: safe.status,
    error: {
      code: safe.code,
      message: safe.message,
      requestId,
      ...(safe.retryAfter ? { retryAfter: safe.retryAfter } : {}),
    },
  };
}
