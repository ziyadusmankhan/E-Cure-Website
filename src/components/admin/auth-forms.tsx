"use client";
import { isAdminNavigation } from "@/lib/admin-navigation";
import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const errorMessages: Record<string, string> = {
  LOGIN_FAILED: "Sign-in failed. Check your details or contact your administrator.",
  UNAUTHENTICATED: "Your session has ended. Please sign in again.",
  VERIFICATION_FAILED: "That security code could not be verified. Try a fresh code.",
  RATE_LIMITED: "Too many attempts. Please wait before trying again.",
  INVALID_INPUT: "Please check the supplied details.",
  FORBIDDEN: "This operation is not permitted. Contact your administrator.",
};
function useAuthRequest() {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const send = async (path: string, values: Record<string, unknown>) => {
    if (busy.current) return null;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const result = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "same-origin",
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
      const json = await result.json();
      if (!result.ok) {
        setError(
          errorMessages[json?.error?.code] ||
            "Sign-in services are temporarily unavailable. Please try again.",
        );
        return null;
      }
      return json;
    } catch {
      setError("We could not complete this request. Please try again.");
      return null;
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return { send, pending, error };
}
const navigate = (next: unknown) => {
  if (isAdminNavigation(next)) window.location.replace(next);
};
export function LoginForm({
  enabled,
  next,
  unavailable,
}: {
  enabled: boolean;
  next: string;
  unavailable: boolean;
}) {
  const { send, pending, error } = useAuthRequest();
  const password = useRef<HTMLInputElement>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const result = await send("/api/auth/login", {
      email: fields.get("email"),
      password: fields.get("password"),
      next,
    });
    if (password.current) password.current.value = "";
    if (result) navigate(result.next);
  };
  return (
    <form className="admin-auth-form" onSubmit={submit}>
      {(!enabled || unavailable) && (
        <p className="submission-notice" role="status">
          Staff sign-in is temporarily unavailable. Please contact your administrator.
        </p>
      )}
      <div className="field">
        <label htmlFor="admin-email">Staff email</label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          maxLength={254}
          required
          disabled={!enabled || unavailable}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-password">Password</label>
        <input
          ref={password}
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          required
          disabled={!enabled || unavailable}
        />
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!enabled || unavailable || pending} aria-busy={pending}>
        {pending ? "Signing in…" : "Sign in securely"}
      </Button>
      <p className="small muted">
        Staff accounts are provided by the business owner. For password or authenticator recovery,
        contact your administrator.
      </p>
    </form>
  );
}
export function LogoutButton() {
  const { send, pending, error } = useAuthRequest();
  return (
    <div>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={async () => {
          const result = await send("/api/auth/logout", {});
          if (result) navigate(result.next);
        }}
      >
        {pending ? "Signing out…" : "Sign out"}
      </Button>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function MfaForm({
  factors,
  next,
}: {
  factors: { id: string; status: string }[];
  next: string;
}) {
  const verified = factors.filter((f) => f.status === "verified");
  const [factorId, setFactorId] = useState(verified[0]?.id || "");
  const [setup, setSetup] = useState<{ qrCode: string; secret: string } | null>(null);
  const { send, pending, error } = useAuthRequest();
  const code = useRef<HTMLInputElement>(null);
  const enroll = async () => {
    const result = await send("/api/auth/mfa/enroll", {});
    if (result?.id && typeof result.qrCode === "string" && typeof result.secret === "string") {
      setFactorId(result.id);
      setSetup({ qrCode: result.qrCode, secret: result.secret });
    }
  };
  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await send("/api/auth/mfa/verify", {
      factorId,
      code: code.current?.value,
      next,
    });
    if (code.current) code.current.value = "";
    if (result) {
      setSetup(null);
      navigate(result.next);
    }
  };
  const qrSource = setup?.qrCode.startsWith("data:image/svg+xml;utf-8,")
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qrCode.slice("data:image/svg+xml;utf-8,".length))}`
    : "";
  return (
    <div className="admin-auth-form">
      {!verified.length && !setup && (
        <>
          <p>
            Add this staff account to your authenticator app, then enter its six-digit code. You
            have ten minutes to finish this step.
          </p>
          <Button type="button" disabled={pending} onClick={enroll}>
            Set up authenticator
          </Button>
        </>
      )}
      {setup && (
        <div className="admin-mfa-setup">
          {qrSource && (
            <Image
              src={qrSource}
              alt="Scan this QR code with your authenticator app"
              width={200}
              height={200}
              unoptimized
            />
          )}
          <label htmlFor="authenticator-secret">Manual setup key</label>
          <input id="authenticator-secret" readOnly value={setup.secret} autoComplete="off" />
          <p className="small muted">
            Keep this key private. Reloading this page requires a new setup.
          </p>
        </div>
      )}
      {factorId && (
        <form onSubmit={verify} className="admin-auth-form">
          {verified.length > 1 && (
            <div className="field">
              <label htmlFor="mfa-factor">Authenticator</label>
              <select
                id="mfa-factor"
                value={factorId}
                onChange={(e) => setFactorId(e.target.value)}
              >
                {verified.map((f, i) => (
                  <option value={f.id} key={f.id}>
                    Authenticator {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="mfa-code">Six-digit security code</label>
            <input
              ref={code}
              id="mfa-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              required
            />
          </div>
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Verifying…" : "Verify and continue"}
          </Button>
        </form>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <p className="small muted">
        If your authenticator is unavailable, contact your administrator. Signing out ends this
        setup session.
      </p>
      <LogoutButton />
    </div>
  );
}
