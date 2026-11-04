import Link from "next/link";
import { pageOperations, recordOr404 } from "@/server/admin/page-data";
import { CustomerEditor } from "@/components/admin/operations-ui";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ history?: string }>;
}) {
  const { ops } = await pageOperations("customers:manage", "/admin/customers");
  const { id } = await params;
  const data = await recordOr404(() => ops.customer(id));
  return (
    <>
      <Link href="/admin/customers">← Customers</Link>
      <h1>{data.record.name}</h1>
      <CustomerEditor data={data} />
      <h2>Appointment requests</h2>
      <ul className="admin-recent admin-customer-requests">
        {data.appointments.map((a) => (
          <li key={a.id}>
            <Link href={`/admin/appointments/${a.id}`}>{a.reference}</Link> · {a.date} · {a.status}
          </li>
        ))}
      </ul>
    </>
  );
}
