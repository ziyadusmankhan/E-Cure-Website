import Link from "next/link";
import { pageOperations, recordOr404 } from "@/server/admin/page-data";
import { RecordEditor } from "@/components/admin/operations-ui";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ history?: string }>;
}) {
  const { ops, principal } = await pageOperations("inquiries:manage", "/admin/inquiries");
  const { id } = await params;
  const f = await searchParams;
  const data = await recordOr404(() => ops.inquiry(id, Number(f.history || 1)));
  const r = data.record;
  return (
    <>
      <Link href="/admin/inquiries">← Inquiries</Link>
      <h1>{r.reference || "Inquiry"}</h1>
      <section className="admin-card">
        <h2>{r.name}</h2>
        <p>
          {r.subject} · {r.email || "No email"}
        </p>
        <p className="preserve-lines">{r.message}</p>
      </section>
      <RecordEditor area="inquiries" data={data} owner={principal.role === "owner"} />
    </>
  );
}
