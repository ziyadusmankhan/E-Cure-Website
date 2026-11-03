import { relations, sql } from "drizzle-orm";
import {
  pgSchema,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  smallint,
  jsonb,
  timestamp,
  date,
  index,
  check,
} from "drizzle-orm/pg-core";

// Private schema: never add this to the Supabase Data API exposed schemas.
export const healthcare = pgSchema("healthcare");
export type ContentBlock = {
  type: "paragraph" | "bullets";
  heading?: string;
  text?: string;
  items?: string[];
};
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
export const appointmentStatus = healthcare.enum("appointment_status", [
  "new",
  "contacted",
  "confirmed",
  "completed",
  "cancelled",
  "declined",
]);
export const inquiryStatus = healthcare.enum("inquiry_status", ["new", "read", "archived"]);

export const businessSettings = healthcare.table(
  "business_settings",
  {
    id: smallint("id").primaryKey().default(1),
    profileId: varchar("profile_id", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    businessType: varchar("business_type", { length: 40 }).notNull(),
    timezone: varchar("timezone", { length: 80 }).notNull().default("Asia/Karachi"),
    theme: varchar("theme", { length: 40 }).notNull(),
    contactEmail: varchar("contact_email", { length: 254 }),
    phone: varchar("phone", { length: 24 }),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("business_singleton", sql`${t.id} = 1`),
    check("business_name_nonempty", sql`length(trim(${t.name})) > 0`),
    check(
      "business_theme_valid",
      sql`${t.theme} in ('clinical-blue', 'soft-teal', 'warm-neutral')`,
    ),
  ],
);

export const services = healthcare.table(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 160 }).notNull(),
    description: varchar("description", { length: 1000 }).notNull(),
    content: jsonb("content").$type<ContentBlock[]>().notNull().default([]),
    enabled: boolean("enabled").notNull().default(false),
    published: boolean("published").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("service_slug_valid", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    check("service_title_nonempty", sql`length(trim(${t.title})) > 0`),
    check("service_order_nonnegative", sql`${t.displayOrder} >= 0`),
    check("service_content_array", sql`jsonb_typeof(${t.content}) = 'array'`),
    index("services_public_order_idx").on(t.enabled, t.published, t.displayOrder),
  ],
);

export const pages = healthcare.table(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 160 }).notNull(),
    description: varchar("description", { length: 1000 }).notNull(),
    content: jsonb("content").$type<ContentBlock[]>().notNull().default([]),
    published: boolean("published").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("page_slug_valid", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    check("page_title_nonempty", sql`length(trim(${t.title})) > 0`),
    check("page_content_array", sql`jsonb_typeof(${t.content}) = 'array'`),
  ],
);

export const customers = healthcare.table(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 24 }).notNull(),
    email: varchar("email", { length: 254 }),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("customer_name_nonempty", sql`length(trim(${t.name})) > 0`),
    check("customer_phone_valid", sql`${t.phone} ~ '^[+]?[0-9]{7,15}$'`),
    check(
      "customer_email_valid",
      sql`${t.email} is null or ${t.email} ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'`,
    ),
    index("customers_phone_idx").on(t.phone),
    index("customers_email_idx").on(t.email),
  ],
);

export const appointments = healthcare.table(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: varchar("reference", { length: 40 }).notNull().unique(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    visitMode: varchar("visit_mode", { length: 20 }).notNull(),
    preferredDate: date("preferred_date", { mode: "string" }).notNull(),
    timeWindow: varchar("time_window", { length: 80 }).notNull(),
    status: appointmentStatus("status").notNull().default("new"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    inquiry: varchar("inquiry", { length: 500 }).notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("appointment_mode_valid", sql`${t.visitMode} in ('home', 'clinic', 'online')`),
    check("appointment_time_nonempty", sql`length(trim(${t.timeWindow})) > 0`),
    check("appointment_reference_valid", sql`${t.reference} ~ '^REQ-[A-F0-9]{24}$'`),
    check(
      "appointment_date_range",
      sql`${t.preferredDate} between '2000-01-01'::date and '2100-12-31'::date`,
    ),
    check(
      "appointment_confirmed_time",
      sql`${t.status} not in ('confirmed', 'completed') or ${t.confirmedAt} is not null`,
    ),
    index("appointments_status_created_idx").on(t.status, t.createdAt),
    index("appointments_preferred_date_idx").on(t.preferredDate),
    index("appointments_customer_idx").on(t.customerId),
    index("appointments_service_idx").on(t.serviceId),
  ],
);

export const contactInquiries = healthcare.table(
  "contact_inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: varchar("reference", { length: 40 })
      .notNull()
      .unique()
      .default(sql`'INQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 24))`),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    subject: varchar("subject", { length: 160 }).notNull(),
    message: text("message").notNull(),
    status: inquiryStatus("status").notNull().default("new"),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("inquiry_name_nonempty", sql`length(trim(${t.name})) > 0`),
    check("inquiry_reference_valid", sql`${t.reference} ~ '^INQ-[A-F0-9]{24}$'`),
    check(
      "inquiry_email_valid",
      sql`${t.email} ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'`,
    ),
    check("inquiry_subject_nonempty", sql`length(trim(${t.subject})) > 0`),
    check("inquiry_message_length", sql`length(trim(${t.message})) between 10 and 2000`),
    index("inquiries_status_created_idx").on(t.status, t.createdAt),
  ],
);

export const administrativeRoles = healthcare.table(
  "administrative_roles",
  {
    key: varchar("key", { length: 20 }).primaryKey(),
    label: varchar("label", { length: 80 }).notNull(),
  },
  (t) => [check("admin_role_valid", sql`${t.key} in ('owner', 'receptionist')`)],
);

// Verified Supabase Auth identity mapping. Provisioned only by trusted tooling.
export const administrativeUsers = healthcare.table("administrative_users", {
  userId: uuid("user_id").primaryKey(),
  authIssuer: varchar("auth_issuer", { length: 500 }).notNull().default(""),
  roleKey: varchar("role_key", { length: 20 })
    .notNull()
    .references(() => administrativeRoles.key, { onDelete: "restrict" }),
  active: boolean("active").notNull().default(false),
  createdAt: createdAt(),
});

export const administrativeSessions = healthcare.table(
  "administrative_sessions",
  {
    keyHash: varchar("key_hash", { length: 64 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => administrativeUsers.userId, { onDelete: "cascade" }),
    encryptedTokens: text("encrypted_tokens").notNull(),
    createdAt: createdAt(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    check("admin_session_hash_valid", sql`${t.keyHash} ~ '^[a-f0-9]{64}$'`),
    check(
      "admin_session_lifetime_valid",
      sql`${t.expiresAt} > ${t.createdAt} and ${t.expiresAt} <= ${t.createdAt} + interval '8 hours'`,
    ),
    index("admin_sessions_user_idx").on(t.userId),
    index("admin_sessions_expiry_idx").on(t.expiresAt),
  ],
);

export const auditEvents = healthcare.table(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => administrativeUsers.userId, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 40 }).notNull(),
    entityType: varchar("entity_type", { length: 40 }).notNull(),
    entityId: varchar("entity_id", { length: 80 }).notNull(),
    // Only structural metadata. Never copy form fields, database errors or credentials here.
    metadata: jsonb("metadata")
      .$type<{ source: "foundation" | "fixture" | "authentication" }>()
      .notNull()
      .default({ source: "foundation" }),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "audit_action_valid",
      sql`${t.action} in ('created', 'updated', 'deleted', 'requested', 'seeded', 'signed_in', 'signed_out', 'mfa_verified')`,
    ),
    check(
      "audit_entity_valid",
      sql`${t.entityType} in ('business', 'service', 'page', 'customer', 'appointment', 'inquiry', 'administration')`,
    ),
    check(
      "audit_metadata_redacted",
      sql`${t.metadata} in ('{"source":"foundation"}'::jsonb, '{"source":"fixture"}'::jsonb, '{"source":"authentication"}'::jsonb)`,
    ),
    index("audit_entity_created_idx").on(t.entityType, t.entityId, t.createdAt),
    index("audit_actor_idx").on(t.actorId),
  ],
);

export const submissionReceipts = healthcare.table(
  "submission_receipts",
  {
    keyHash: varchar("key_hash", { length: 64 }).primaryKey(),
    fingerprint: varchar("fingerprint", { length: 64 }).notNull(),
    kind: varchar("kind", { length: 20 }).notNull(),
    reference: varchar("reference", { length: 40 }).notNull(),
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "restrict",
    }),
    inquiryId: uuid("inquiry_id").references(() => contactInquiries.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '7 days'`),
  },
  (t) => [
    check(
      "receipt_kind_valid",
      sql`(${t.kind} = 'appointment' and ${t.appointmentId} is not null and ${t.inquiryId} is null) or (${t.kind} = 'inquiry' and ${t.inquiryId} is not null and ${t.appointmentId} is null)`,
    ),
    check(
      "receipt_hash_valid",
      sql`${t.keyHash} ~ '^[a-f0-9]{64}$' and ${t.fingerprint} ~ '^[a-f0-9]{64}$'`,
    ),
    index("receipt_expiry_idx").on(t.expiresAt),
  ],
);
export const submissionLimits = healthcare.table(
  "submission_limits",
  {
    keyHash: varchar("key_hash", { length: 64 }).primaryKey(),
    attempts: integer("attempts").notNull().default(1),
    resetsAt: timestamp("resets_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    check("limit_attempts_positive", sql`${t.attempts} > 0`),
    check("limit_hash_valid", sql`${t.keyHash} ~ '^[a-f0-9]{64}$'`),
    index("limit_expiry_idx").on(t.resetsAt),
  ],
);

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  customer: one(customers, { fields: [appointments.customerId], references: [customers.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
}));
export const customersRelations = relations(customers, ({ many }) => ({
  appointments: many(appointments),
}));
export const servicesRelations = relations(services, ({ many }) => ({
  appointments: many(appointments),
}));
export const administrativeUsersRelations = relations(administrativeUsers, ({ one, many }) => ({
  role: one(administrativeRoles, {
    fields: [administrativeUsers.roleKey],
    references: [administrativeRoles.key],
  }),
  events: many(auditEvents),
}));
export const administrativeRolesRelations = relations(administrativeRoles, ({ many }) => ({
  users: many(administrativeUsers),
}));
export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  actor: one(administrativeUsers, {
    fields: [auditEvents.actorId],
    references: [administrativeUsers.userId],
  }),
}));
