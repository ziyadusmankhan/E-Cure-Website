"use client";
import Link from "next/link";
import type { SubmissionConfig, SubmissionKind } from "@/types/submission";
import { Turnstile } from "./turnstile";
export function SubmissionSecurity({
  config,
  kind,
  consent,
  setConsent,
  tokenChanged,
  resetKey,
  error,
  website,
  setWebsite,
}: {
  config: SubmissionConfig;
  kind: SubmissionKind;
  consent: boolean;
  setConsent: (value: boolean) => void;
  tokenChanged: (value: string) => void;
  resetKey: number;
  error: string;
  website: string;
  setWebsite: (value: string) => void;
}) {
  return (
    <div className="submission-security">
      <div className="form-honeypot" aria-hidden="true">
        <label htmlFor={`${kind}-website`}>Leave this field empty</label>
        <input
          id={`${kind}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <label className="submission-consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-invalid={!!error}
          aria-describedby={error ? `${kind}-consent-error` : undefined}
        />
        <span>
          {config.localTest
            ? "I agree to store this fictional request in the local test database."
            : "I agree to send these details for this request."}{" "}
          <Link href="/privacy-policy">Read the privacy notice</Link>.
        </span>
      </label>
      {error && (
        <p className="field-error" id={`${kind}-consent-error`} role="alert">
          {error}
        </p>
      )}
      {!config.unavailable && (
        <Turnstile
          siteKey={config.siteKey}
          action={kind}
          resetKey={resetKey}
          onToken={tokenChanged}
        />
      )}
    </div>
  );
}
