import Link from "next/link";
import { pageOperations } from "@/server/admin/page-data";
import { Search, Pager } from "@/components/admin/operations-ui";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { ops, principal } = await pageOperations("inquiries:manage", "/admin/inquiries");
  const f = await searchParams;
  const data = await ops.listInquiries(f);
  return (
    <>
      <span className="eyebrow">STAFF WORKSPACE</span>
      <h1>Inquiries</h1>
      {principal.role === "receptionist" && <p>Showing requests assigned to you.</p>}
      <Search area="inquiries" q={f.q || ""} status={f.status || ""} />
      <div className="admin-table-wrap">
        <table>
          <caption className="sr-only">Inquiries search results</caption>
          <thead>
            <tr>
              <th scope="col">Reference</th>
              <th scope="col">Name</th>
              <th scope="col">Subject</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/inquiries/${r.id}`}>{r.reference || "—"}</Link>
                </td>
                <td>{r.name || "—"}</td>
                <td>{r.subject || "—"}</td>
                <td>{r.status || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.items.length && <p className="admin-empty">No matching inquiries.</p>}
      <Pager total={data.total} page={data.page} q={f.q} status={f.status} />
    </>
  );
}
