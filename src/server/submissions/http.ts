import "server-only";
import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";
import type { SubmissionKind } from "@/types/submission";
import { getDatabase, type Database } from "../db/connection";
import { BackendError, publicError } from "../errors";
import { loopbackHost, submissionPolicy, type SubmissionPolicy } from "./config";
import { publicAppointmentSchema, publicInquirySchema } from "./validation";
import { persistSubmission } from "./store";
import { verifyTurnstile } from "./turnstile";

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
async function readJson(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json"
  )
    throw new BackendError("UNSUPPORTED_MEDIA");
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > 16384))
    throw new BackendError("PAYLOAD_TOO_LARGE");
  if (request.headers.get("content-encoding")) throw new BackendError("UNSUPPORTED_MEDIA");
  const reader = request.body?.getReader();
  if (!reader) throw new BackendError("BAD_REQUEST");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw new BackendError("PAYLOAD_TOO_LARGE");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof BackendError) throw error;
    throw new BackendError("BAD_REQUEST");
  } finally {
    reader.releaseLock();
  }
}
export async function handleSubmission(
  request: Request,
  kind: SubmissionKind,
  deps: { db?: Database; policy?: SubmissionPolicy; verify?: typeof verifyTurnstile } = {},
) {
  const requestId = randomUUID();
  try {
    const policy = deps.policy ?? submissionPolicy();
    if (policy.mode === "disabled") throw new BackendError("SUBMISSIONS_DISABLED");
    const origin = request.headers.get("origin");
    const url = new URL(request.url);
    if (
      !origin ||
      !policy.origins.includes(origin) ||
      (policy.mode === "local-test" && !loopbackHost(url.hostname)) ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      throw new BackendError("FORBIDDEN");
    const key = z.uuid().parse(request.headers.get("idempotency-key"));
    const body = await readJson(request);
    const values =
      kind === "appointment"
        ? publicAppointmentSchema.parse(body)
        : publicInquirySchema.parse(body);
    const claimedIp =
      policy.ipHeader === "none" ? "" : request.headers.get(policy.ipHeader)?.trim() || "";
    const client = isIP(claimedIp) ? claimedIp : "shared-unverified-origin";
    const result = await persistSubmission({
      db: deps.db ?? getDatabase(),
      kind,
      values,
      key,
      client,
      policy,
      verify: () => (deps.verify ?? verifyTurnstile)(values.turnstileToken, kind, origin, policy),
    });
    return Response.json(
      { ...result.receipt, requestId },
      { status: result.replayed ? 200 : 201, headers },
    );
  } catch (error) {
    const safe = publicError(error, requestId);
    if (safe.status >= 500)
      console.error(JSON.stringify({ requestId, operation: kind, code: safe.error.code }));
    return Response.json(
      { error: safe.error },
      {
        status: safe.status,
        headers: {
          ...headers,
          ...(safe.status === 429 ? { "Retry-After": String(safe.error.retryAfter ?? 900) } : {}),
        },
      },
    );
  }
}
