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
  const { ops, principal } = await pageOperations("appointments:manage", "/admin/appointments");
  const { id } = await params;
  const f = await searchParams;
  const data = await recordOr404(() => ops.appointment(id, Number(f.history || 1)));
  const r = data.record;
  return (
    <>
      <Link href="/admin/appointments">← Appointments</Link>
      <h1>{r.reference || "Inquiry"}</h1>
      <section className="admin-card admin-record-summary">
        <div className="admin-summary-heading"><h2>{r.name}</h2><Link href={`/admin/customers/${r.customerId}`}>View customer</Link></div>
        <dl className="admin-detail-fields">
          <div><dt>Phone</dt><dd>{r.phone}</dd></div>
          <div><dt>Email</dt><dd>{r.email || "No email"}</dd></div>
          <div><dt>Service</dt><dd>{r.service}</dd></div>
          <div><dt>Requested date</dt><dd>{r.date}</dd></div>
          <div><dt>Time preference</dt><dd>{r.time}</dd></div>
          <div><dt>Visit mode</dt><dd>{r.visitMode}</dd></div>
        </dl>
        <p className="preserve-lines admin-request-message">{r.inquiry}</p>
        {r.confirmedAt && (
          <p>
            Confirmed visit:{" "}
            {new Intl.DateTimeFormat("en", {
              timeZone: data.timezone,
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(r.confirmedAt))}{" "}
            ({data.timezone})
          </p>
        )}
      </section>
      <RecordEditor area="appointments" data={data} owner={principal.role === "owner"} />
    </>
  );
}
