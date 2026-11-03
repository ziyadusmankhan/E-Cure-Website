import Link from "next/link";
import { pageOperations } from "@/server/admin/page-data";
export const metadata = { title: "Staff workspace" };
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { principal, ops } = await pageOperations("workspace:read", "/admin");
  const data = await ops.dashboard();
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
      <h2>Appointment requests</h2>
      <div className="admin-stats">
        {data.states.map((s) => (
          <Link
            className="admin-card"
            href={`/admin/appointments?status=${s.status}`}
            key={s.status}
          >
            <strong>{s.total}</strong>
            <span>{s.status}</span>
          </Link>
        ))}
      </div>
      {!data.states.length && (
        <p>
          No appointment requests {principal.role === "receptionist" ? "assigned to you" : "yet"}.
        </p>
      )}
      <h2>Recent appointments</h2>
      <ul className="admin-recent">
        {data.recent.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/appointments/${r.id}`}>{r.reference}</Link>
            <span>
              {r.name} · {r.date} · {r.status}
            </span>
          </li>
        ))}
      </ul>
      <h2>Recent inquiries</h2>
      <ul className="admin-recent">
        {data.inquiries.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/inquiries/${r.id}`}>{r.name}</Link>
            <span>
              {r.subject} · {r.status}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
