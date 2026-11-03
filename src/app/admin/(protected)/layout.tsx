import Link from "next/link";
import { LogoutButton } from "@/components/admin/auth-forms";
import { requireAdminPage } from "@/server/auth/pages";
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { principal } = await requireAdminPage();
  return (
    <div className="admin-workspace">
      <aside className="admin-workspace-nav">
        <strong>Staff workspace</strong>
        <nav aria-label="Staff sections">
          <Link href="/admin" prefetch={false}>
            Overview
          </Link>
          {principal.role === "owner" && (
            <Link href="/admin/access" prefetch={false}>
              Access and permissions
            </Link>
          )}
        </nav>
        <LogoutButton />
      </aside>
      <div className="admin-workspace-content">{children}</div>
    </div>
  );
}
