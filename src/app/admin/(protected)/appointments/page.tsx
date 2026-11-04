import Link from "next/link";
import { pageOperations } from "@/server/admin/page-data";
import { Search, Pager } from "@/components/admin/operations-ui";
import { RecordTable, WorkflowStatus } from "@/components/admin/record-table";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { ops, principal } = await pageOperations("appointments:manage", "/admin/appointments");
  const f = await searchParams;
  const data = await ops.listAppointments(f);
  return (
    <>
      <span className="eyebrow">STAFF WORKSPACE</span>
      <h1>Appointments</h1>
      {principal.role === "receptionist" && <p>Showing requests assigned to you.</p>}
      <Search area="appointments" q={f.q || ""} status={f.status || ""} />
      {principal.role === "owner" && (
        <p className="admin-export">
          <a
            href={
              "/api/admin/appointments/export?" +
              new URLSearchParams({ q: f.q || "", status: f.status || "" })
            }
          >
            Export CSV (up to 1,000 results)
          </a>
        </p>
      )}
      <RecordTable
        caption="Appointments search results"
        headings={["Reference","Name","Service","Date","Status"]}
        rows={data.items.map(r => ({ id: r.id, cells: [<Link key="link" href={`/admin/appointments/${r.id}`}>{r.reference || "—"}</Link>, r.name || "—", r.service || "—", r.date || "—", <WorkflowStatus key="status" status={r.status || "—"} />] }))}
        emptyMessage="No matching appointments."
      />
      <Pager total={data.total} page={data.page} q={f.q} status={f.status} />
    </>
  );
}
