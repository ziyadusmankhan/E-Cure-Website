import { requireAdminPage } from "@/server/auth/pages";
export const metadata = { title: "Access and permissions" };
export default async function AccessPage() {
  await requireAdminPage("access:read", "/admin/access");
  return (
    <>
      <span className="eyebrow">OWNER ACCESS</span>
      <h1>Access and permissions.</h1>
      <p>Only Owners can view this section.</p>
      <div className="admin-role-cards">
        <article>
          <h2>Owner</h2>
          <p>
            Access to the staff workspace and permission policy. Business settings and user
            administration are reserved for this role.
          </p>
        </article>
        <article>
          <h2>Receptionist</h2>
          <p>
            Access to assigned appointment and inquiry workflows, including their customer contact
            records. Owner settings and user administration remain restricted.
          </p>
        </article>
      </div>
      <p className="muted">
        Accounts are set up by an authorized administrator. A sign-in account also needs explicit
        staff access.
      </p>
    </>
  );
}
