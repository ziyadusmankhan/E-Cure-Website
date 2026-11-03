import "server-only";
import { and, or, eq, ilike, desc, sql, count } from "drizzle-orm";
import { z } from "zod";
import {
  appointments,
  customers,
  services,
  contactInquiries,
  workflowEvents,
  administrativeUsers,
  businessSettings,
} from "../db/schema";
import type { Database, Transaction } from "../db/connection";
import type { AdminIdentity, AdminPermission } from "@/types/admin-auth";
import {
  appointmentStatuses,
  inquiryStatuses,
  appointmentTransitions,
  type AppointmentState,
} from "@/types/operations";
import { BackendError, operation } from "../errors";
import { guardActor, adminAudit } from "./guard";
import { customerSchema, idSchema } from "../validation";
const filters = z
  .object({
    q: z.string().trim().max(100).default(""),
    status: z.string().max(30).default(""),
    page: z.coerce.number().int().min(1).max(10000).default(1),
  })
  .strict();
const escaped = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
const version = z.number().int().min(0).max(2147483646);
const note = z.string().trim().max(1000).default("");
const appointmentChange = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("status"),
      version,
      status: z.enum(appointmentStatuses),
      confirmedAt: z.iso.datetime({ offset: true }).optional(),
      note,
    })
    .strict(),
  z
    .object({ action: z.literal("note"), version, note: z.string().trim().min(1).max(1000) })
    .strict(),
  z.object({ action: z.literal("assign"), version, assignedTo: z.uuid().nullable() }).strict(),
]);
const inquiryChange = z.discriminatedUnion("action", [
  z
    .object({ action: z.literal("status"), version, status: z.enum(inquiryStatuses), note })
    .strict(),
  z
    .object({ action: z.literal("note"), version, note: z.string().trim().min(1).max(1000) })
    .strict(),
  z.object({ action: z.literal("assign"), version, assignedTo: z.uuid().nullable() }).strict(),
]);
export function operationsStore(db: Database, actor: AdminIdentity) {
  const scope = (field: typeof appointments.assignedTo | typeof contactInquiries.assignedTo) =>
    actor.role === "owner" ? undefined : eq(field, actor.userId);
  const transact = <T>(permission: AdminPermission, fn: (tx: Transaction) => Promise<T>) =>
    operation(() =>
      db.transaction(async (tx) => {
        await tx.execute(
          sql`select set_config('lock_timeout','10000',true),set_config('statement_timeout','15000',true)`,
        );
        await guardActor(tx, actor, permission);
        return fn(tx);
      }),
    );
  const staff = async (tx: Transaction) =>
    actor.role === "owner"
      ? tx
          .select({ id: administrativeUsers.userId, role: administrativeUsers.roleKey })
          .from(administrativeUsers)
          .where(
            and(
              eq(administrativeUsers.active, true),
              eq(administrativeUsers.authIssuer, actor.issuer),
            ),
          )
          .orderBy(administrativeUsers.createdAt)
      : [];
  const validAssignment = async (tx: Transaction, id: string | null) => {
    if (actor.role !== "owner") throw new BackendError("FORBIDDEN");
    if (id) {
      const [found] = await tx
        .select({ id: administrativeUsers.userId })
        .from(administrativeUsers)
        .where(
          and(
            eq(administrativeUsers.userId, id),
            eq(administrativeUsers.active, true),
            eq(administrativeUsers.authIssuer, actor.issuer),
          ),
        );
      if (!found) throw new BackendError("INVALID_INPUT");
    }
  };
  const history = async (
    tx: Transaction,
    kind: "appointment" | "inquiry",
    id: string,
    page: number,
  ) => {
    const condition =
      kind === "appointment"
        ? eq(workflowEvents.appointmentId, id)
        : eq(workflowEvents.inquiryId, id);
    const [{ total }] = await tx.select({ total: count() }).from(workflowEvents).where(condition);
    const rows = await tx
      .select()
      .from(workflowEvents)
      .where(condition)
      .orderBy(desc(workflowEvents.createdAt), desc(workflowEvents.id))
      .limit(30)
      .offset((page - 1) * 30);
    return {
      total,
      page,
      items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    };
  };
  return {
    dashboard: () =>
      transact("workspace:read", async (tx) => {
        const states = await tx
          .select({ status: appointments.status, total: count() })
          .from(appointments)
          .where(scope(appointments.assignedTo))
          .groupBy(appointments.status);
        const recent = await tx
          .select({
            id: appointments.id,
            reference: appointments.reference,
            status: appointments.status,
            name: customers.name,
            date: appointments.preferredDate,
          })
          .from(appointments)
          .innerJoin(customers, eq(appointments.customerId, customers.id))
          .where(scope(appointments.assignedTo))
          .orderBy(desc(appointments.createdAt))
          .limit(8);
        const inquiries = await tx
          .select({
            id: contactInquiries.id,
            name: contactInquiries.name,
            subject: contactInquiries.subject,
            status: contactInquiries.status,
          })
          .from(contactInquiries)
          .where(scope(contactInquiries.assignedTo))
          .orderBy(desc(contactInquiries.createdAt))
          .limit(5);
        return { states, recent, inquiries };
      }),
    listAppointments: (input: unknown, exporting = false) =>
      transact(exporting ? "exports:read" : "appointments:manage", async (tx) => {
        const f = filters.parse(input);
        if (f.status && !appointmentStatuses.includes(f.status as AppointmentState))
          throw new BackendError("INVALID_INPUT");
        const where = and(
          scope(appointments.assignedTo),
          f.status ? sql`${appointments.status}=${f.status}` : undefined,
          f.q
            ? or(
                ilike(appointments.reference, escaped(f.q)),
                ilike(customers.name, escaped(f.q)),
                ilike(customers.phone, escaped(f.q)),
                ilike(customers.email, escaped(f.q)),
              )
            : undefined,
        );
        const [{ total }] = await tx
          .select({ total: count() })
          .from(appointments)
          .innerJoin(customers, eq(appointments.customerId, customers.id))
          .where(where);
        const rows = await tx
          .select({
            id: appointments.id,
            reference: appointments.reference,
            status: appointments.status,
            date: appointments.preferredDate,
            time: appointments.timeWindow,
            name: customers.name,
            phone: customers.phone,
            email: customers.email,
            service: services.title,
            assignedTo: appointments.assignedTo,
          })
          .from(appointments)
          .innerJoin(customers, eq(appointments.customerId, customers.id))
          .innerJoin(services, eq(appointments.serviceId, services.id))
          .where(where)
          .orderBy(desc(appointments.createdAt), desc(appointments.id))
          .limit(exporting ? 1000 : 20)
          .offset(exporting ? 0 : (f.page - 1) * 20);
        return { items: rows, total, page: f.page, perPage: exporting ? 1000 : 20 };
      }),
    appointment: (id: string, eventPage = 1) =>
      transact("appointments:manage", async (tx) => {
        idSchema.parse(id);
        const page = z.number().int().min(1).max(10000).parse(eventPage);
        const [row] = await tx
          .select({
            id: appointments.id,
            reference: appointments.reference,
            status: appointments.status,
            version: appointments.version,
            date: appointments.preferredDate,
            time: appointments.timeWindow,
            visitMode: appointments.visitMode,
            inquiry: appointments.inquiry,
            confirmedAt: appointments.confirmedAt,
            assignedTo: appointments.assignedTo,
            customerId: customers.id,
            name: customers.name,
            phone: customers.phone,
            email: customers.email,
            service: services.title,
            createdAt: appointments.createdAt,
          })
          .from(appointments)
          .innerJoin(customers, eq(appointments.customerId, customers.id))
          .innerJoin(services, eq(appointments.serviceId, services.id))
          .where(and(eq(appointments.id, id), scope(appointments.assignedTo)));
        if (!row) throw new BackendError("NOT_FOUND");
        const [settings] = await tx
          .select({ timezone: businessSettings.timezone })
          .from(businessSettings)
          .where(eq(businessSettings.id, 1));
        return {
          record: {
            ...row,
            createdAt: row.createdAt.toISOString(),
            confirmedAt: row.confirmedAt?.toISOString() || null,
          },
          history: await history(tx, "appointment", id, page),
          staff: await staff(tx),
          timezone: settings.timezone,
        };
      }),
    changeAppointment: (id: string, input: unknown) =>
      transact("appointments:manage", async (tx) => {
        idSchema.parse(id);
        const v = appointmentChange.parse(input);
        const [row] = await tx
          .select()
          .from(appointments)
          .where(and(eq(appointments.id, id), scope(appointments.assignedTo)))
          .for("update");
        if (!row) throw new BackendError("NOT_FOUND");
        if (row.version !== v.version) throw new BackendError("CONFLICT");
        let status = row.status,
          confirmedAt = row.confirmedAt,
          assignedTo = row.assignedTo;
        if (v.action === "assign") {
          await validAssignment(tx, v.assignedTo);
          assignedTo = v.assignedTo;
        }
        if (v.action === "status") {
          const reopen =
            actor.role === "owner" &&
            ["cancelled", "declined"].includes(row.status) &&
            v.status === "new" &&
            v.note.length >= 5;
          if (!reopen && !appointmentTransitions[row.status].includes(v.status))
            throw new BackendError("INVALID_TRANSITION");
          status = v.status;
          if (reopen) confirmedAt = null;
          else if (v.confirmedAt) confirmedAt = new Date(v.confirmedAt);
          if (["confirmed", "completed"].includes(status) && !confirmedAt)
            throw new BackendError("INVALID_INPUT");
          if (status === "completed" && confirmedAt && confirmedAt > new Date())
            throw new BackendError("INVALID_INPUT");
        }
        await tx
          .update(appointments)
          .set({ status, confirmedAt, assignedTo, version: row.version + 1 })
          .where(eq(appointments.id, id));
        await tx
          .insert(workflowEvents)
          .values({
            appointmentId: id,
            actorId: actor.userId,
            kind: v.action === "assign" ? "assignment" : v.action,
            fromStatus: row.status,
            toStatus: status,
            note: v.action === "assign" ? "Assignment updated" : v.note,
            assignedTo,
          });
        await adminAudit(tx, actor, "updated", "appointment", id);
        return { version: row.version + 1 };
      }),
    listCustomers: (input: unknown) =>
      transact("customers:manage", async (tx) => {
        const f = filters.parse(input);
        const permitted =
          actor.role === "owner"
            ? undefined
            : sql`exists(select 1 from healthcare.appointments a where a.customer_id=${customers.id} and a.assigned_to=${actor.userId})`;
        const where = and(
          permitted,
          f.q
            ? or(
                ilike(customers.name, escaped(f.q)),
                ilike(customers.phone, escaped(f.q)),
                ilike(customers.email, escaped(f.q)),
              )
            : undefined,
        );
        const [{ total }] = await tx.select({ total: count() }).from(customers).where(where);
        const rows = await tx
          .select({
            id: customers.id,
            name: customers.name,
            phone: customers.phone,
            email: customers.email,
            version: customers.version,
          })
          .from(customers)
          .where(where)
          .orderBy(customers.name, customers.id)
          .limit(20)
          .offset((f.page - 1) * 20);
        return { items: rows, total, page: f.page, perPage: 20 };
      }),
    customer: (id: string) =>
      transact("customers:manage", async (tx) => {
        idSchema.parse(id);
        const permitted =
          actor.role === "owner"
            ? undefined
            : sql`exists(select 1 from healthcare.appointments a where a.customer_id=${customers.id} and a.assigned_to=${actor.userId})`;
        const [row] = await tx
          .select({
            id: customers.id,
            name: customers.name,
            phone: customers.phone,
            email: customers.email,
            version: customers.version,
            consentAt: customers.consentAt,
          })
          .from(customers)
          .where(and(eq(customers.id, id), permitted));
        if (!row) throw new BackendError("NOT_FOUND");
        const records = await tx
          .select({
            id: appointments.id,
            reference: appointments.reference,
            date: appointments.preferredDate,
            status: appointments.status,
          })
          .from(appointments)
          .where(and(eq(appointments.customerId, id), scope(appointments.assignedTo)))
          .orderBy(desc(appointments.createdAt))
          .limit(100);
        return {
          record: { ...row, consentAt: row.consentAt?.toISOString() || null },
          appointments: records,
        };
      }),
    changeCustomer: (id: string, input: unknown) =>
      transact("customers:manage", async (tx) => {
        idSchema.parse(id);
        const v = z.object({ version, customer: customerSchema }).strict().parse(input);
        const permitted =
          actor.role === "owner"
            ? undefined
            : sql`exists(select 1 from healthcare.appointments a where a.customer_id=${customers.id} and a.assigned_to=${actor.userId})`;
        const [row] = await tx
          .select()
          .from(customers)
          .where(and(eq(customers.id, id), permitted))
          .for("update");
        if (!row) throw new BackendError("NOT_FOUND");
        if (v.version !== row.version) throw new BackendError("CONFLICT");
        await tx
          .update(customers)
          .set({ ...v.customer, version: row.version + 1 })
          .where(eq(customers.id, id));
        await adminAudit(tx, actor, "updated", "customer", id);
        return { version: row.version + 1 };
      }),
    listInquiries: (input: unknown) =>
      transact("inquiries:manage", async (tx) => {
        const f = filters.parse(input);
        if (f.status && !inquiryStatuses.includes(f.status as (typeof inquiryStatuses)[number]))
          throw new BackendError("INVALID_INPUT");
        const where = and(
          scope(contactInquiries.assignedTo),
          f.status ? sql`${contactInquiries.status}=${f.status}` : undefined,
          f.q
            ? or(
                ilike(contactInquiries.reference, escaped(f.q)),
                ilike(contactInquiries.name, escaped(f.q)),
                ilike(contactInquiries.email, escaped(f.q)),
                ilike(contactInquiries.subject, escaped(f.q)),
              )
            : undefined,
        );
        const [{ total }] = await tx.select({ total: count() }).from(contactInquiries).where(where);
        const rows = await tx
          .select({
            id: contactInquiries.id,
            reference: contactInquiries.reference,
            name: contactInquiries.name,
            email: contactInquiries.email,
            subject: contactInquiries.subject,
            status: contactInquiries.status,
            assignedTo: contactInquiries.assignedTo,
          })
          .from(contactInquiries)
          .where(where)
          .orderBy(desc(contactInquiries.createdAt), desc(contactInquiries.id))
          .limit(20)
          .offset((f.page - 1) * 20);
        return { items: rows, total, page: f.page, perPage: 20 };
      }),
    inquiry: (id: string, eventPage = 1) =>
      transact("inquiries:manage", async (tx) => {
        idSchema.parse(id);
        const page = z.number().int().min(1).max(10000).parse(eventPage);
        const [row] = await tx
          .select()
          .from(contactInquiries)
          .where(and(eq(contactInquiries.id, id), scope(contactInquiries.assignedTo)));
        if (!row) throw new BackendError("NOT_FOUND");
        return {
          record: {
            ...row,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            consentAt: row.consentAt?.toISOString() || null,
          },
          history: await history(tx, "inquiry", id, page),
          staff: await staff(tx),
        };
      }),
    changeInquiry: (id: string, input: unknown) =>
      transact("inquiries:manage", async (tx) => {
        idSchema.parse(id);
        const v = inquiryChange.parse(input);
        const [row] = await tx
          .select()
          .from(contactInquiries)
          .where(and(eq(contactInquiries.id, id), scope(contactInquiries.assignedTo)))
          .for("update");
        if (!row) throw new BackendError("NOT_FOUND");
        if (row.version !== v.version) throw new BackendError("CONFLICT");
        let status = row.status,
          assignedTo = row.assignedTo;
        if (v.action === "assign") {
          await validAssignment(tx, v.assignedTo);
          assignedTo = v.assignedTo;
        }
        if (v.action === "status") {
          if (v.status === row.status) throw new BackendError("INVALID_TRANSITION");
          status = v.status;
        }
        await tx
          .update(contactInquiries)
          .set({ status, assignedTo, version: row.version + 1 })
          .where(eq(contactInquiries.id, id));
        await tx
          .insert(workflowEvents)
          .values({
            inquiryId: id,
            actorId: actor.userId,
            kind: v.action === "assign" ? "assignment" : v.action,
            fromStatus: row.status,
            toStatus: status,
            note: v.action === "assign" ? "Assignment updated" : v.note,
            assignedTo,
          });
        await adminAudit(tx, actor, "updated", "inquiry", id);
        return { version: row.version + 1 };
      }),
  };
}
export type Operations = ReturnType<typeof operationsStore>;
