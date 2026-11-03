import Link from "next/link";
import { pageOperations } from "@/server/admin/page-data";
import { Search, Pager } from "@/components/admin/operations-ui";
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
        <p>
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
      <div className="admin-table-wrap">
        <table>
          <caption className="sr-only">Appointments search results</caption>
          <thead>
            <tr>
              <th scope="col">Reference</th>
              <th scope="col">Name</th>
              <th scope="col">Service</th>
              <th scope="col">Date</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/appointments/${r.id}`}>{r.reference || "—"}</Link>
                </td>
                <td>{r.name || "—"}</td>
                <td>{r.service || "—"}</td>
                <td>{r.date || "—"}</td>
                <td>{r.status || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.items.length && <p className="admin-empty">No matching appointments.</p>}
      <Pager total={data.total} page={data.page} q={f.q} status={f.status} />
    </>
  );
}
