import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import type { Database } from "../db/connection";
import {
  appointments,
  auditEvents,
  businessSettings,
  contactInquiries,
  customers,
  services,
  submissionLimits,
  submissionReceipts,
} from "../db/schema";
import { site } from "@/config/site";
import { services as configuredServices } from "@/data/services";
import type { SubmissionKind, SubmissionReceipt } from "@/types/submission";
import { BackendError, operation } from "../errors";
import type { AppointmentSubmission, InquirySubmission } from "./validation";
import { validatePreferredDate } from "./validation";
import type { SubmissionPolicy } from "./config";

export const digest = (secret: string, text: string) =>
  createHmac("sha256", secret).update(text).digest("hex");
export async function takeRateLimit(
  db: Database,
  secret: string,
  bucket: string,
  limit: number,
  windowMs: number,
  now = new Date(),
) {
  const start = Math.floor(now.valueOf() / windowMs) * windowMs;
  const keyHash = digest(secret, `limit:${bucket}:${start}`);
  const [row] = await db
    .insert(submissionLimits)
    .values({ keyHash, resetsAt: new Date(start + windowMs) })
    .onConflictDoUpdate({
      target: submissionLimits.keyHash,
      set: { attempts: sql`${submissionLimits.attempts} + 1` },
    })
    .returning({ attempts: submissionLimits.attempts });
  // This statement commits outside the submission transaction: rejected attempts count.
  if (row.attempts > limit)
    throw new BackendError(
      "RATE_LIMITED",
      Math.max(1, Math.ceil((start + windowMs - now.valueOf()) / 1000)),
    );
}
export type SubmissionData = AppointmentSubmission | InquirySubmission;
export async function persistSubmission(args: {
  db: Database;
  kind: SubmissionKind;
  values: SubmissionData;
  key: string;
  client: string;
  policy: SubmissionPolicy;
  verify: () => Promise<void>;
  now?: Date;
}) {
  return operation(async () => {
    const { db, kind, values, policy, verify } = args;
    const now = args.now ?? new Date();
    if (values.website) throw new BackendError("VERIFICATION_FAILED");
    const keyHash = digest(policy.hmacSecret, `receipt:${kind}:${args.key}`);
    const { turnstileToken: _token, website: _website, ...content } = values;
    void _token;
    void _website;
    const fingerprint = digest(policy.hmacSecret, JSON.stringify(content));
    const readReceipt = async (
      executor: Database | Parameters<Parameters<Database["transaction"]>[0]>[0],
    ) => {
      const [row] = await executor
        .select()
        .from(submissionReceipts)
        .where(and(eq(submissionReceipts.keyHash, keyHash), gt(submissionReceipts.expiresAt, now)));
      if (!row) return null;
      if (row.fingerprint !== fingerprint) throw new BackendError("CONFLICT");
      return { reference: row.reference, status: "new" as const };
    };
    const [business] = await db.select().from(businessSettings).where(eq(businessSettings.id, 1));
    if (!business || business.profileId !== site.id) throw new BackendError("CONFIGURATION");
    const cached = await readReceipt(db);
    if (cached) return { receipt: cached, replayed: true };
    await takeRateLimit(db, policy.hmacSecret, `${kind}:client:${args.client}`, 6, 15 * 60000, now);
    const contact =
      kind === "appointment"
        ? (values as AppointmentSubmission).phone
        : (values as InquirySubmission).email;
    await takeRateLimit(db, policy.hmacSecret, `${kind}:contact:${contact}`, 3, 60 * 60000, now);
    // Bounded expiry cleanup; no customer/request records are removed.
    await db.execute(
      sql`delete from healthcare.submission_limits where key_hash in (select key_hash from healthcare.submission_limits where resets_at < now() - interval '1 day' limit 100)`,
    );
    await db.execute(
      sql`delete from healthcare.submission_receipts where key_hash in (select key_hash from healthcare.submission_receipts where expires_at < now() limit 100)`,
    );
    return db.transaction(async (tx) => {
      await tx.execute(
        sql`select set_config('statement_timeout', '15000', true), set_config('lock_timeout', '10000', true)`,
      );
      await tx.execute(
        sql`select pg_advisory_xact_lock(${parseInt(keyHash.slice(0, 8), 16) | 0}, ${parseInt(keyHash.slice(8, 16), 16) | 0})`,
      );
      const repeated = await readReceipt(tx);
      if (repeated) return { receipt: repeated, replayed: true };
      await tx
        .delete(submissionReceipts)
        .where(and(eq(submissionReceipts.keyHash, keyHash), lt(submissionReceipts.expiresAt, now)));
      let serviceId: string | undefined;
      if (kind === "appointment") {
        const input = values as AppointmentSubmission;
        if (
          !site.features.booking ||
          !configuredServices.some((service) => service.slug === input.service)
        )
          throw new BackendError("SERVICE_UNAVAILABLE");
        validatePreferredDate(input.date, input.time, business.timezone, now);
        const [service] = await tx
          .select({ id: services.id })
          .from(services)
          .where(
            and(
              eq(services.slug, input.service),
              eq(services.enabled, true),
              eq(services.published, true),
            ),
          )
          .for("share");
        if (!service) throw new BackendError("SERVICE_UNAVAILABLE");
        serviceId = service.id;
      } else if (!site.features.inquiryForm) throw new BackendError("FORBIDDEN");
      await verify();
      let receipt: SubmissionReceipt;
      let recordId: string;
      if (kind === "appointment") {
        const input = values as AppointmentSubmission;
        const [person] = await tx
          .insert(customers)
          .values({
            name: input.name,
            phone: input.phone,
            email: input.email || null,
            consentAt: now,
          })
          .returning({ id: customers.id });
        const [row] = await tx
          .insert(appointments)
          .values({
            customerId: person.id,
            serviceId: serviceId!,
            reference: `REQ-${randomBytes(12).toString("hex").toUpperCase()}`,
            preferredDate: input.date,
            timeWindow: input.time,
            visitMode: input.visitMode,
            inquiry: input.inquiry,
          })
          .returning({ id: appointments.id, reference: appointments.reference });
        await tx
          .insert(auditEvents)
          .values({ entityType: "customer", entityId: person.id, action: "created" });
        await tx
          .insert(auditEvents)
          .values({ entityType: "appointment", entityId: row.id, action: "requested" });
        receipt = { reference: row.reference, status: "new" };
        recordId = row.id;
      } else {
        const input = values as InquirySubmission;
        const labels = {
          "care-options": site.copy.forms_contact_form_exploring_care_options_13,
          "service-areas": site.copy.forms_contact_form_service_locations_14,
          appointments: site.copy.forms_contact_form_appointment_arrangements_15,
          other: site.copy.forms_contact_form_something_else_16,
        };
        const [row] = await tx
          .insert(contactInquiries)
          .values({
            name: input.name,
            email: input.email,
            subject: labels[input.topic],
            message: input.message,
            consentAt: now,
            reference: `INQ-${randomBytes(12).toString("hex").toUpperCase()}`,
          })
          .returning({ id: contactInquiries.id, reference: contactInquiries.reference });
        await tx
          .insert(auditEvents)
          .values({ entityType: "inquiry", entityId: row.id, action: "created" });
        receipt = { reference: row.reference, status: "new" };
        recordId = row.id;
      }
      await tx
        .insert(submissionReceipts)
        .values({
          keyHash,
          fingerprint,
          kind,
          reference: receipt.reference,
          appointmentId: kind === "appointment" ? recordId : null,
          inquiryId: kind === "inquiry" ? recordId : null,
        });
      return { receipt, replayed: false };
    });
  });
}
