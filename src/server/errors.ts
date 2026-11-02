import "server-only";
import { ZodError } from "zod";

export type ErrorCode =
  "INVALID_INPUT" | "NOT_FOUND" | "CONFLICT" | "UNAVAILABLE" | "CONFIGURATION" | "INTERNAL";
const messages: Record<ErrorCode, string> = {
  INVALID_INPUT: "Please check the supplied information.",
  NOT_FOUND: "The requested record is unavailable.",
  CONFLICT: "The change conflicts with an existing record.",
  UNAVAILABLE: "The service is temporarily unavailable.",
  CONFIGURATION: "The backend is not configured for this operation.",
  INTERNAL: "The operation could not be completed.",
};
const statuses: Record<ErrorCode, number> = {
  INVALID_INPUT: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAVAILABLE: 503,
  CONFIGURATION: 503,
  INTERNAL: 500,
};
export class BackendError extends Error {
  readonly status: number;
  constructor(readonly code: ErrorCode) {
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
      "53300",
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
  return { status: safe.status, error: { code: safe.code, message: safe.message, requestId } };
}
