import Link from "next/link";
import { LogoutButton } from "@/components/admin/auth-forms";
import { requireAdminPage } from "@/server/auth/pages";
import { headers } from "next/headers";
import { safeAdminNext } from "@/lib/admin-navigation";
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get("x-healthcare-admin-path") || "/admin";
  const next = safeAdminNext(path.split("/").slice(0, 3).join("/"));
  const { principal } = await requireAdminPage("workspace:read", next);
  return (
    <div className="admin-workspace">
      <aside className="admin-workspace-nav">
        <strong>Staff workspace</strong>
        <details className="admin-nav-disclosure" open>
          <summary>Workspace navigation</summary>
          <nav aria-label="Staff sections">
            <Link href="/admin" prefetch={false}>
              Overview
            </Link>
            <Link href="/admin/appointments" prefetch={false}>
              Appointments
            </Link>
            <Link href="/admin/customers" prefetch={false}>
              Customers
            </Link>
            <Link href="/admin/inquiries" prefetch={false}>
              Inquiries
            </Link>
            {principal.role === "owner" && (
              <>
                <Link href="/admin/website" prefetch={false}>
                  Website editor
                </Link>
                <Link href="/admin/access" prefetch={false}>
                  Access and permissions
                </Link>
              </>
            )}
          </nav>
        </details>
        <LogoutButton />
      </aside>
      <div className="admin-workspace-content">{children}</div>
    </div>
  );
}
