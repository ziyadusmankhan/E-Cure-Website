import Link from "next/link";
import { ArrowUpRight, CalendarDays, MessagesSquare, ShieldCheck } from "lucide-react";
import { AdminEmpty, WorkflowStatus } from "@/components/admin/record-table";
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
      <div className="admin-section-heading"><h2>Appointment requests</h2><Link href="/admin/appointments">View all requests<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      <div className="admin-stats">
        {data.states.map((s) => (
          <Link
            className="admin-card"
            href={`/admin/appointments?status=${s.status}`}
            key={s.status}
          >
            <span className="admin-stat-label"><WorkflowStatus status={s.status} /><ArrowUpRight size={17} aria-hidden="true" /></span>
            <strong>{s.total}</strong>
            <span className="admin-stat-caption">Appointment requests</span>
          </Link>
        ))}
      </div>
      {!data.states.length && (
        <AdminEmpty>
          No appointment requests {principal.role === "receptionist" ? "assigned to you" : "yet"}.
        </AdminEmpty>
      )}
      <div className="admin-dashboard-columns">
      <section className="admin-card admin-recent-panel">
      <div className="admin-section-heading"><h2><CalendarDays size={19} aria-hidden="true" />Recent appointments</h2></div>
      {!data.recent.length && <p className="admin-inline-empty">Your recent appointment requests will appear here.</p>}
      <ul className="admin-recent">
        {data.recent.map((r) => (
          <li key={r.id}>
            <div><Link href={`/admin/appointments/${r.id}`}>{r.reference}</Link><span>{r.name} · {r.date}</span></div>
            <WorkflowStatus status={r.status} />
          </li>
        ))}
      </ul>
      </section>
      <section className="admin-card admin-recent-panel">
      <div className="admin-section-heading"><h2><MessagesSquare size={19} aria-hidden="true" />Recent inquiries</h2><Link href="/admin/inquiries">View all<span className="sr-only"> inquiries</span><ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      {!data.inquiries.length && <p className="admin-inline-empty">Your recent inquiries will appear here.</p>}
      <ul className="admin-recent">
        {data.inquiries.map((r) => (
          <li key={r.id}>
            <div><Link href={`/admin/inquiries/${r.id}`}>{r.name}</Link><span>{r.subject}</span></div>
            <WorkflowStatus status={r.status} />
          </li>
        ))}
      </ul>
      </section>
      </div>
      <div className="admin-security-summary">
        <ShieldCheck size={22} aria-hidden="true" />
        <div><h2>Account protection</h2>
        <p>
          Your session ends after 30 minutes of inactivity or eight hours. Sign out when you finish
          on a shared device.
        </p></div>
      </div>
    </>
  );
}
