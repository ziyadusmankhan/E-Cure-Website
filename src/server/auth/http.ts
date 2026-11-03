import "server-only";
import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rolePermissions, type AdminPermission } from "@/types/admin-auth";
import { getDatabase, type Database } from "../db/connection";
import { BackendError, publicError } from "../errors";
import { takeRateLimit } from "../submissions/store";
import { authPolicy, cookieName, safeAdminNext, sessionHours, type AuthPolicy } from "./config";
import { authStore } from "./store";
import { supabaseAuthProvider, type AuthProvider } from "./provider";

export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
export function authRuntime(
  deps: { policy?: AuthPolicy; db?: Database; provider?: AuthProvider } = {},
) {
  const policy = deps.policy ?? authPolicy();
  if (!policy) throw new BackendError("CONFIGURATION");
  const db = deps.db ?? getDatabase();
  return {
    policy,
    db,
    store: authStore(db, policy, deps.provider ?? supabaseAuthProvider(policy)),
  };
}
async function body(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !== "application/json" ||
    request.headers.get("content-encoding")
  )
    throw new BackendError("UNSUPPORTED_MEDIA");
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > 8192))
    throw new BackendError("PAYLOAD_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) throw new BackendError("BAD_REQUEST");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) {
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
const loginSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(128),
    next: z.string().max(200).optional(),
  })
  .strict();
const mfaSchema = z
  .object({
    factorId: z.uuid(),
    code: z.string().regex(/^[0-9]{6}$/),
    next: z.string().max(200).optional(),
  })
  .strict();
type Action = "login" | "logout" | "enroll" | "verify";
export async function handleAuth(
  request: NextRequest,
  action: Action,
  deps: { policy?: AuthPolicy; db?: Database; provider?: AuthProvider } = {},
) {
  const requestId = randomUUID();
  try {
    const { policy, store, db } = authRuntime(deps);
    if (
      !policy.origins.includes(request.headers.get("origin") || "") ||
      request.headers.get("sec-fetch-site") === "cross-site" ||
      (policy.mode === "local" &&
        !["127.0.0.1", "localhost", "[::1]"].includes(new URL(request.url).hostname))
    )
      throw new BackendError("FORBIDDEN");
    const raw = request.cookies.get(cookieName(policy))?.value;
    const json = await body(request);
    const response = (value: unknown) => NextResponse.json(value, { headers: privateHeaders });
    if (action === "logout") {
      z.object({}).strict().parse(json);
      await store.signOut(raw);
      const result = response({ next: "/admin/login" });
      result.cookies.set(cookieName(policy), "", {
        path: "/",
        httpOnly: true,
        secure: policy.secure,
        sameSite: "strict",
        maxAge: 0,
      });
      return result;
    }
    const claimed =
      policy.ipHeader === "none" ? "" : request.headers.get(policy.ipHeader)?.trim() || "";
    const client = isIP(claimed) ? claimed : "shared-unverified-origin";
    await takeRateLimit(
      db,
      policy.encryptionKey,
      `auth:${action}:client:${client}`,
      action === "login" ? 20 : 30,
      15 * 60000,
    );
    if (action === "login") {
      const values = loginSchema.parse(json);
      await takeRateLimit(
        db,
        policy.encryptionKey,
        `auth:login:account:${values.email}`,
        5,
        15 * 60000,
      );
      const result = await store.signIn(values.email, values.password, raw);
      const next = safeAdminNext(values.next);
      const outgoing = response({
        next: result.needsMfa ? `/admin/mfa?next=${encodeURIComponent(next)}` : next,
      });
      outgoing.cookies.set(cookieName(policy), result.raw, {
        path: "/",
        httpOnly: true,
        secure: policy.secure,
        sameSite: "strict",
        maxAge: sessionHours * 3600,
        priority: "high",
      });
      return outgoing;
    }
    // Verify a real active staff session before spending a per-session MFA budget.
    await store.authorize(raw, undefined, false);
    await takeRateLimit(db, policy.encryptionKey, `auth:${action}:session:${raw}`, 5, 5 * 60000);
    if (action === "enroll") {
      z.object({}).strict().parse(json);
      return response(await store.enroll(raw));
    }
    const values = mfaSchema.parse(json);
    await store.verifyMfa(raw, values.factorId, values.code);
    return response({ next: safeAdminNext(values.next) });
  } catch (error) {
    const safe = publicError(error, requestId);
    if (safe.status >= 500)
      console.error(
        JSON.stringify({ requestId, operation: `auth:${action}`, code: safe.error.code }),
      );
    return NextResponse.json(
      { error: safe.error },
      {
        status: safe.status,
        headers: {
          ...privateHeaders,
          ...(safe.status === 429 ? { "Retry-After": String(safe.error.retryAfter ?? 60) } : {}),
        },
      },
    );
  }
}
export async function handleAdminRead(
  request: NextRequest,
  permission: AdminPermission,
  deps: { policy?: AuthPolicy; db?: Database; provider?: AuthProvider } = {},
) {
  const requestId = randomUUID();
  try {
    const { policy, store } = authRuntime(deps);
    const { principal } = await store.authorize(
      request.cookies.get(cookieName(policy))?.value,
      permission,
    );
    return NextResponse.json(
      permission === "access:read"
        ? { roles: rolePermissions }
        : { role: principal.role, expiresAt: principal.expiresAt },
      { headers: privateHeaders },
    );
  } catch (error) {
    const safe = publicError(error, requestId);
    return NextResponse.json(
      { error: safe.error },
      { status: safe.status, headers: privateHeaders },
    );
  }
}
