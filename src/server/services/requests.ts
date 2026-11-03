import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../db/connection";
import { workflowEvents, appointments, contactInquiries, customers, services } from "../db/schema";
import { BackendError, operation } from "../errors";
import {
  appointmentSchema,
  customerSchema,
  idSchema,
  inquirySchema,
  inquiryStatusSchema,
} from "../validation";
import { audit } from "./audit";

// Internal-only APIs. The public form, anti-spam, rate limits and idempotent
// submission boundary are deliberately deferred to Phase 6.
export function requestService(db: Database) {
  return {
    createCustomer: (input: unknown) =>
      operation(async () => {
        const values = customerSchema.parse(input);
        return db.transaction(async (tx) => {
          const [row] = await tx.insert(customers).values(values).returning();
          await audit(tx, "created", "customer", row.id);
          return row;
        });
      }),
    getCustomer: (id: string) =>
      operation(async () => {
        idSchema.parse(id);
        return (await db.select().from(customers).where(eq(customers.id, id)).limit(1))[0] ?? null;
      }),
    replaceCustomer: (id: string, input: unknown) =>
      operation(async () => {
        idSchema.parse(id);
        const values = customerSchema.parse(input);
        return db.transaction(async (tx) => {
          const [row] = await tx
            .update(customers)
            .set(values)
            .where(eq(customers.id, id))
            .returning();
          if (!row) throw new BackendError("NOT_FOUND");
          await audit(tx, "updated", "customer", id);
          return row;
        });
      }),
    deleteCustomer: (id: string) =>
      operation(async () => {
        idSchema.parse(id);
        return db.transaction(async (tx) => {
          const [row] = await tx
            .delete(customers)
            .where(eq(customers.id, id))
            .returning({ id: customers.id });
          if (!row) throw new BackendError("NOT_FOUND");
          await audit(tx, "deleted", "customer", id);
          return row;
        });
      }),
    createAppointmentRequest: (input: unknown) =>
      operation(async () => {
        const values = appointmentSchema.parse(input);
        return db.transaction(async (tx) => {
          // Lock prevents disabling/unpublishing the service during this request.
          const [service] = await tx
            .select({ id: services.id })
            .from(services)
            .where(
              and(
                eq(services.id, values.serviceId),
                eq(services.enabled, true),
                eq(services.published, true),
              ),
            )
            .for("share");
          if (!service) throw new BackendError("NOT_FOUND");
          const [customer] = await tx
            .insert(customers)
            .values({ ...values.customer, consentAt: new Date() })
            .returning({ id: customers.id });
          const [appointment] = await tx
            .insert(appointments)
            .values({
              customerId: customer.id,
              serviceId: service.id,
              visitMode: values.visitMode,
              preferredDate: values.preferredDate,
              timeWindow: values.timeWindow,
              reference: `REQ-${randomBytes(12).toString("hex").toUpperCase()}`,
            })
            .returning({
              id: appointments.id,
              reference: appointments.reference,
              status: appointments.status,
            });
          await audit(tx, "created", "customer", customer.id);
          await tx
            .insert(workflowEvents)
            .values({ appointmentId: appointment.id, toStatus: "new" });
          await audit(tx, "requested", "appointment", appointment.id);
          return appointment;
        });
      }),
    getAppointment: (id: string) =>
      operation(async () => {
        idSchema.parse(id);
        return (
          (await db.query.appointments.findFirst({
            where: eq(appointments.id, id),
            with: { customer: true, service: true },
          })) ?? null
        );
      }),
    createInquiry: (input: unknown) =>
      operation(async () => {
        const values = inquirySchema.parse(input);
        return db.transaction(async (tx) => {
          const [row] = await tx
            .insert(contactInquiries)
            .values(values)
            .returning({ id: contactInquiries.id, status: contactInquiries.status });
          await tx.insert(workflowEvents).values({ inquiryId: row.id, toStatus: row.status });
          await audit(tx, "created", "inquiry", row.id);
          return row;
        });
      }),
    listInquiries: () =>
      operation(() =>
        db.select().from(contactInquiries).orderBy(desc(contactInquiries.createdAt)).limit(50),
      ),
    setInquiryStatus: (id: string, status: unknown) =>
      operation(async () => {
        idSchema.parse(id);
        const next = inquiryStatusSchema.parse(status);
        return db.transaction(async (tx) => {
          const [row] = await tx
            .update(contactInquiries)
            .set({ status: next })
            .where(eq(contactInquiries.id, id))
            .returning({ id: contactInquiries.id, status: contactInquiries.status });
          if (!row) throw new BackendError("NOT_FOUND");
          await audit(tx, "updated", "inquiry", id);
          return row;
        });
      }),
  };
}
