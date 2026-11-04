import { Brand } from "@/components/shared/brand";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/auth-forms";
import { authPolicy, safeAdminNext } from "@/server/auth/config";
import { currentAdmin } from "@/server/auth/pages";
import { BackendError } from "@/server/errors";
export const metadata = { title: "Staff sign in" };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const query = await searchParams;
  const next = safeAdminNext(query.next);
  let enabled = false;
  let unavailable = query.error === "unavailable";
  let destination = "";
  try {
    const policy = authPolicy();
    enabled = !!policy;
    if (enabled && !unavailable) {
      try {
        await currentAdmin("workspace:read");
        destination = next;
      } catch (error) {
        if (error instanceof BackendError && error.code === "MFA_REQUIRED")
          destination = `/admin/mfa?next=${encodeURIComponent(next)}`;
        else if (!(error instanceof BackendError) || error.code !== "UNAUTHENTICATED")
          unavailable = true;
      }
    }
  } catch {
    unavailable = true;
  }
  if (destination) redirect(destination);
  return (
    <div className="admin-auth-card">
      <div className="admin-auth-brand"><Brand /></div>
      <div className="admin-auth-body">
      <span className="admin-auth-symbol"><ShieldCheck size={25} aria-hidden="true" /></span>
      <span className="eyebrow">STAFF ACCESS</span>
      <h1>Welcome back.</h1>
      <p>Sign in to your secure staff workspace.</p>
      <LoginForm enabled={enabled} next={next} unavailable={unavailable} />
      </div>
      <p className="admin-auth-footer">Authorized staff access</p>
    </div>
  );
}
