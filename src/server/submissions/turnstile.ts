import "server-only";
import type { SubmissionKind } from "@/types/submission";
import type { SubmissionPolicy } from "./config";
import { BackendError } from "../errors";

export async function verifyTurnstile(
  token: string,
  kind: SubmissionKind,
  origin: string,
  policy: SubmissionPolicy,
  request: typeof fetch = fetch,
) {
  if (policy.mode === "local-test" && token !== "XXXX.DUMMY.TOKEN.XXXX")
    throw new BackendError("VERIFICATION_FAILED");
  let result: { success?: boolean; hostname?: string; action?: string };
  try {
    const response = await request("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: policy.secretKey, response: token }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) throw new Error();
    result = await response.json();
  } catch {
    throw new BackendError("UNAVAILABLE");
  }
  if (
    result?.success !== true ||
    (policy.mode === "live" &&
      (result.hostname !== new URL(origin).hostname || result.action !== kind))
  )
    throw new BackendError("VERIFICATION_FAILED");
}
