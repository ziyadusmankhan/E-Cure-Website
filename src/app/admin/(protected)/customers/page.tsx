import Link from "next/link";
import { pageOperations } from "@/server/admin/page-data";
import { Search, Pager } from "@/components/admin/operations-ui";
import { RecordTable } from "@/components/admin/record-table";
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
      <RecordTable
        caption="Customers search results"
        headings={["Name","Phone","Email"]}
        rows={data.items.map(r => ({ id: r.id, cells: [<Link key="link" href={`/admin/customers/${r.id}`}>{r.name || "—"}</Link>, r.phone || "—", r.email || "—"] }))}
        emptyMessage="No matching customers."
      />
      <Pager total={data.total} page={data.page} q={f.q} status={f.status} />
    </>
  );
}
