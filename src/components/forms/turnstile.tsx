"use client";
import { useEffect, useRef, useState } from "react";
import type { SubmissionKind } from "@/types/submission";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
let loading: Promise<void> | undefined;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    const fail = () => {
      script.remove();
      loading = undefined;
      reject(new Error("Security check unavailable"));
    };
    const timeout = window.setTimeout(fail, 15000);
    script.onload = () => {
      clearTimeout(timeout);
      if (window.turnstile) resolve();
      else fail();
    };
    script.onerror = () => {
      clearTimeout(timeout);
      fail();
    };
    document.head.appendChild(script);
  });
  return loading;
}
export function Turnstile({
  siteKey,
  action,
  resetKey,
  onToken,
}: {
  siteKey: string;
  action: SubmissionKind;
  resetKey: number;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  const [status, setStatus] = useState("Preparing security check…");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);
  useEffect(() => {
    let cancelled = false;
    let widget: string | undefined;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      callback.current("");
      setStatus("Preparing security check…");
      try {
        await loadTurnstile();
        if (cancelled || !container.current || !window.turnstile) return;
        widget = window.turnstile.render(container.current, {
          sitekey: siteKey,
          action,
          theme: "light",
          size: "compact",
          callback: (token: string) => {
            if (!cancelled) {
              callback.current(token);
              setStatus("Security check complete.");
            }
          },
          "expired-callback": () => {
            if (!cancelled) {
              callback.current("");
              setStatus("Security check expired. Please retry verification.");
            }
          },
          "error-callback": (code: string) => {
            if (!cancelled) {
              callback.current("");
              setStatus(
                code === "200100"
                  ? "Security check unavailable because of a clock or cached challenge problem. Check your device time or try another network, then retry verification."
                  : "Security check unavailable. Please retry verification.",
              );
            }
          },
        });
      } catch {
        if (!cancelled) setStatus("Security check unavailable. Please retry verification.");
      }
    });
    return () => {
      cancelled = true;
      if (widget) {
        try {
          window.turnstile?.remove(widget);
        } catch {}
      }
    };
  }, [siteKey, action, resetKey, retry]);
  return (
    <div className="submission-verification">
      <div ref={container} data-testid="turnstile-widget" />
      <p className="field-hint" role="status">
        {status}
      </p>
      {/unavailable|expired/.test(status) && (
        <button type="button" className="text-link" onClick={() => setRetry((v) => v + 1)}>
          Retry verification
        </button>
      )}
    </div>
  );
}
