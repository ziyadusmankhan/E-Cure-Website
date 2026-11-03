import { requireAdminPage } from "@/server/auth/pages";
export const metadata = { title: "Staff workspace" };
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { principal } = await requireAdminPage();
  return (
    <>
      <span className="eyebrow">SECURE STAFF ACCESS</span>
      <h1>Your workspace.</h1>
      <p>
        You are signed in as{" "}
        <strong>{principal.role === "owner" ? "Owner" : "Receptionist"}</strong>.
      </p>
      {(await searchParams).denied === "1" && (
        <p className="submission-notice" role="status">
          That section requires Owner access.
        </p>
      )}
      <div className="admin-security-summary">
        <h2>Account protection</h2>
        <p>
          Your session ends after 30 minutes of inactivity or eight hours. Sign out when you finish
          on a shared device.
        </p>
      </div>
      <p className="muted">
        Your account is ready. Appointment, inquiry and content management tools are being prepared.
      </p>
    </>
  );
}
