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
      <section className="admin-card">
        <h2>{r.name}</h2>
        <p>
          {r.phone} · {r.email || "No email"}
        </p>
        <p>
          {r.service} · {r.date} · {r.time} · {r.visitMode}
        </p>
        <p>{r.inquiry}</p>
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
        <Link href={`/admin/customers/${r.customerId}`}>View customer</Link>
      </section>
      <RecordEditor area="appointments" data={data} owner={principal.role === "owner"} />
    </>
  );
}
