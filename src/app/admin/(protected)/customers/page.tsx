import Link from "next/link";
import { pageOperations } from "@/server/admin/page-data";
import { Search, Pager } from "@/components/admin/operations-ui";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { ops, principal } = await pageOperations("customers:manage", "/admin/customers");
  const f = await searchParams;
  const data = await ops.listCustomers(f);
  return (
    <>
      <span className="eyebrow">STAFF WORKSPACE</span>
      <h1>Customers</h1>
      {principal.role === "receptionist" && (
        <p>Showing requests assigned to you and their customers.</p>
      )}
      <Search area="customers" q={f.q || ""} status={f.status || ""} />
      <div className="admin-table-wrap">
        <table>
          <caption className="sr-only">Customers search results</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Phone</th>
              <th scope="col">Email</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/admin/customers/${r.id}`}>{r.name || "—"}</Link>
                </td>
                <td>{r.phone || "—"}</td>
                <td>{r.email || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.items.length && <p className="admin-empty">No matching customers.</p>}
      <Pager total={data.total} page={data.page} q={f.q} status={f.status} />
    </>
  );
}
