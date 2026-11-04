import { StaffFrame, StaffNavigationLink } from "@/components/admin/staff-frame";
import { requireAdminPage } from "@/server/auth/pages";
import { headers } from "next/headers";
import { safeAdminNext } from "@/lib/admin-navigation";
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get("x-healthcare-admin-path") || "/admin";
  const next = safeAdminNext(path.split("/").slice(0, 3).join("/"));
  const { principal } = await requireAdminPage("workspace:read", next);
  return (
    <StaffFrame roleLabel={principal.role === "owner" ? "Owner" : "Receptionist"} navigation={
          <nav aria-label="Staff sections">
            <StaffNavigationLink href="/admin">
              Overview
            </StaffNavigationLink>
            <StaffNavigationLink href="/admin/appointments">
              Appointments
            </StaffNavigationLink>
            <StaffNavigationLink href="/admin/customers">
              Customers
            </StaffNavigationLink>
            <StaffNavigationLink href="/admin/inquiries">
              Inquiries
            </StaffNavigationLink>
            {principal.role === "owner" && (
              <>
                <StaffNavigationLink href="/admin/website">
                  Website editor
                </StaffNavigationLink>
                <StaffNavigationLink href="/admin/access">
                  Access and permissions
                </StaffNavigationLink>
              </>
            )}
          </nav>
    }>{children}</StaffFrame>
  );
}
