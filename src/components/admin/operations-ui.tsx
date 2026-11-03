"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { WorkflowDetail, CustomerDetail } from "@/types/operations";
import { appointmentStatuses, inquiryStatuses, staffLabel } from "@/types/operations";
export type Area = "appointments" | "customers" | "inquiries";
export function Search({ area, q, status }: { area: Area; q: string; status: string }) {
  return (
    <form className="admin-filters" method="get">
      <label>
        Search
        <input
          name="q"
          defaultValue={q}
          maxLength={100}
          placeholder={area === "appointments" ? "Name, phone or reference" : "Name or email"}
        />
      </label>
      {area !== "customers" && (
        <label>
          Status
          <select aria-label="Status" name="status" defaultValue={status}>
            <option value="">All statuses</option>
            {(area === "appointments" ? appointmentStatuses : inquiryStatuses).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      )}
      <button className="button button-primary">Search</button>
    </form>
  );
}
export function Pager({
  total,
  page,
  perPage = 20,
  q = "",
  status = "",
  parameter = "page",
}: {
  total: number;
  page: number;
  perPage?: number;
  q?: string;
  status?: string;
  parameter?: string;
}) {
  const href = (n: number) =>
    `?${new URLSearchParams({ [parameter]: String(n), ...(q ? { q } : {}), ...(status ? { status } : {}) })}`;
  return (
    <nav
      className="admin-pagination"
      aria-label={parameter === "history" ? "History pages" : "Results pages"}
    >
      <span>
        {total} records · Page {page} of {Math.max(1, Math.ceil(total / perPage))}
      </span>
      {page > 1 && <Link href={href(page - 1)}>Previous</Link>}
      {page * perPage < total && <Link href={href(page + 1)}>Next</Link>}
    </nav>
  );
}

export function RecordEditor({
  area,
  data,
  owner,
}: {
  area: "appointments" | "inquiries";
  data: WorkflowDetail;
  owner: boolean;
}) {
  const router = useRouter();
  const r = data.record;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function change(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/${area}/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, version: r.version }),
      });
      const value = await res.json();
      if (!res.ok) throw new Error(value.error?.message || "Unable to save.");
      setMessage("Saved.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  const statusList = area === "appointments" ? appointmentStatuses : inquiryStatuses;
  return (
    <div className="admin-record-grid">
      <section className="admin-card">
        <h2>Update request</h2>
        <p>
          Current status: <strong className="status-chip">{r.status}</strong>
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const local = f.get("confirmedAt") as string;
            void change({
              action: "status",
              status: f.get("status"),
              note: f.get("note"),
              ...(local ? { confirmedAt: new Date(local).toISOString() } : {}),
            });
          }}
        >
          <fieldset disabled={busy}>
            <label>
              New status
              <select aria-label="New status" name="status" defaultValue={r.status}>
                {statusList.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            {area === "appointments" && (
              <>
                <label>
                  Confirmed visit time
                  <input type="datetime-local" name="confirmedAt" />
                </label>
                <p className="muted">
                  Enter in your device’s timezone. Business timezone:{" "}
                  {"timezone" in data ? data.timezone : ""}. Set a time before confirming; a
                  completed visit must be in the past.
                </p>
              </>
            )}
            <label>
              Reason (optional)
              <textarea name="note" maxLength={1000} />
            </label>
            <button className="button button-primary">Update status</button>
          </fieldset>
        </form>
        {owner && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void change({ action: "assign", assignedTo: f.get("assignedTo") || null });
            }}
          >
            <fieldset disabled={busy}>
              <label>
                Assigned staff
                <select
                  aria-label="Assigned staff"
                  name="assignedTo"
                  defaultValue={r.assignedTo || ""}
                >
                  <option value="">Unassigned</option>
                  {data.staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {staffLabel(s.role, s.id)}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button-secondary">Save assignment</button>
            </fieldset>
          </form>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void change({ action: "note", note: f.get("note") });
          }}
        >
          <fieldset disabled={busy}>
            <label>
              Administrative note
              <textarea name="note" required maxLength={1000} />
            </label>
            <p className="muted">
              Use notes for scheduling and follow-up. Do not add diagnoses or medical records.
            </p>
            <button className="button button-secondary">Add note</button>
          </fieldset>
        </form>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </section>
      <section className="admin-card">
        <h2>Status and activity history</h2>
        {!data.history.items.length && <p>No activity yet.</p>}
        <ol className="admin-history">
          {data.history.items.map((item) => (
            <li key={item.id}>
              <strong>
                {item.kind === "status"
                  ? `${item.fromStatus || "Received"} → ${item.toStatus}`
                  : item.kind === "assignment"
                    ? `Assigned: ${item.assignedTo ? staffLabel("Staff", item.assignedTo) : "Unassigned"}`
                    : "Note"}
              </strong>
              <time dateTime={item.createdAt}>
                {item.createdAt.replace("T", " ").replace(".000Z", " UTC")}
              </time>
              {item.note && <p>{item.note}</p>}
              <small>{item.actorId ? staffLabel("Staff", item.actorId) : "Website / system"}</small>
            </li>
          ))}
        </ol>
        <Pager
          total={data.history.total}
          page={data.history.page}
          perPage={30}
          parameter="history"
        />
      </section>
    </div>
  );
}
export function CustomerEditor({ data }: { data: CustomerDetail }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="admin-card"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const f = new FormData(e.currentTarget);
        try {
          const res = await fetch(`/api/admin/customers/${data.record.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              version: data.record.version,
              customer: {
                name: f.get("name"),
                phone: f.get("phone"),
                email: f.get("email") || null,
              },
            }),
          });
          const v = await res.json();
          if (!res.ok) throw new Error(v.error?.message || "Unable to save.");
          setMessage("Customer saved.");
          router.refresh();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Unable to save.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy}>
        <label>
          Name
          <input
            name="name"
            defaultValue={data.record.name}
            required
            minLength={2}
            maxLength={120}
          />
        </label>
        <label>
          Phone
          <input name="phone" type="tel" defaultValue={data.record.phone} required maxLength={40} />
        </label>
        <label>
          Email
          <input name="email" type="email" defaultValue={data.record.email || ""} maxLength={254} />
        </label>
        <button className="button button-primary">Save customer</button>
      </fieldset>
      <p role="status">{message}</p>
    </form>
  );
}
