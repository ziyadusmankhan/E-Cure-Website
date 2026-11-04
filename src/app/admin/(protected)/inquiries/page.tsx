import Link from "next/link";
import { pageOperations } from "@/server/admin/page-data";
import { Search, Pager } from "@/components/admin/operations-ui";
import { RecordTable, WorkflowStatus } from "@/components/admin/record-table";
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
      <RecordTable
        caption="Inquiries search results"
        headings={["Reference","Name","Subject","Status"]}
        rows={data.items.map(r => ({ id: r.id, cells: [<Link key="link" href={`/admin/inquiries/${r.id}`}>{r.reference || "—"}</Link>, r.name || "—", r.subject || "—", <WorkflowStatus key="status" status={r.status || "—"} />] }))}
        emptyMessage="No matching inquiries."
      />
      <Pager total={data.total} page={data.page} q={f.q} status={f.status} />
    </>
  );
}
