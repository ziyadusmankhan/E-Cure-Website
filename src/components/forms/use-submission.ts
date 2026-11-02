"use client";
import { useRef, useState } from "react";
import type { SubmissionKind, SubmissionReceipt } from "@/types/submission";

const messages: Record<string, string> = {
  INVALID_INPUT: "Please check your details and try again.",
  INVALID_DATE: "Choose a future date and a time preference in the business timezone.",
  SERVICE_UNAVAILABLE: "This service is not accepting requests. Please choose another service.",
  RATE_LIMITED: "Too many attempts. Please wait before trying again.",
  VERIFICATION_FAILED: "Please complete a fresh security check and try again.",
  CONFLICT: "This retry conflicts with an earlier request. Please review your details.",
  FORBIDDEN: "This request is not permitted from this address.",
};
export function useSubmission(kind: SubmissionKind) {
  const busy = useRef(false);
  const completed = useRef(false);
  const attempt = useRef<{ content: string; key: string } | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const send = async (body: Record<string, unknown>): Promise<SubmissionReceipt | null> => {
    if (busy.current || completed.current) return null;
    busy.current = true;
    setPending(true);
    setError("");
    const content = JSON.stringify({ ...body, turnstileToken: undefined });
    if (attempt.current?.content !== content)
      attempt.current = { content, key: crypto.randomUUID() };
    try {
      const response = await fetch(
        kind === "appointment" ? "/api/appointments" : "/api/inquiries",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.current.key },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(25000),
          credentials: "same-origin",
          cache: "no-store",
        },
      );
      const data = await response.json();
      if (!response.ok) {
        const wait = Number(response.headers.get("retry-after"));
        setError(
          data?.error?.code === "RATE_LIMITED" && wait > 0 && wait <= 3600
            ? `Too many attempts. Please wait about ${Math.ceil(wait / 60)} ${wait <= 60 ? "minute" : "minutes"} before trying again.`
            : (messages[data?.error?.code] ??
                "The service is temporarily unavailable. Your details are still here; please try again."),
        );
        setResetKey((v) => v + 1);
        return null;
      }
      if (
        data?.status !== "new" ||
        !new RegExp(`^${kind === "appointment" ? "REQ" : "INQ"}-[A-F0-9]{24}$`).test(
          data?.reference ?? "",
        )
      )
        throw new Error();
      completed.current = true;
      attempt.current = undefined;
      return { reference: data.reference, status: "new" };
    } catch {
      setError(
        "We could not confirm whether your request was saved. Your details are still here. Retry to check safely using the same request identifier.",
      );
      setResetKey((v) => v + 1);
      return null;
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return {
    send,
    pending,
    error,
    resetKey,
    reset: () => {
      attempt.current = undefined;
      completed.current = false;
      setError("");
      setResetKey((v) => v + 1);
    },
  };
}
