import { redirect } from "next/navigation";
import { MfaForm } from "@/components/admin/auth-forms";
import { requireAdminPage } from "@/server/auth/pages";
import { safeAdminNext } from "@/server/auth/config";
export const metadata = { title: "Two-step verification" };
export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeAdminNext((await searchParams).next);
  const { principal, factors } = await requireAdminPage("workspace:read", next, false);
  if (principal.aal === "aal2" && factors.some((f) => f.status === "verified")) redirect(next);
  return (
    <div className="admin-auth-card">
      <span className="eyebrow">ACCOUNT SECURITY</span>
      <h1>Two-step verification.</h1>
      <MfaForm factors={factors} next={next} />
    </div>
  );
}
