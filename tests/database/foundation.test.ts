import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { and, count, eq, sql } from "drizzle-orm";
import { openDatabase } from "../../src/server/db/connection";
import { migrateDatabase } from "../../src/server/db/migrate";
import { seedDemoProfile } from "../../src/server/db/fixtures";
import { appointments, auditEvents, customers, services } from "../../src/server/db/schema";
import { catalogService } from "../../src/server/services/catalog";
import { requestService } from "../../src/server/services/requests";
import { assertTestDatabase, connectionSettings } from "../../src/server/env";
import { BackendError, operation, publicError, safeError } from "../../src/server/errors";
import { appointmentSchema, contentSchema, customerSchema } from "../../src/server/validation";
import { backendForDeployment } from "../../src/server/backend";

const forbidden = [process.env.DATABASE_URL, process.env.DIRECT_URL];
for (const key of [
  "TEST_DATABASE_URL",
  "TEST_MIGRATION_URL",
  "TEST_ISOLATION_DATABASE_URL",
] as const)
  assertTestDatabase(process.env[key], forbidden);
const app = openDatabase(process.env.TEST_DATABASE_URL);
const admin = openDatabase(process.env.TEST_MIGRATION_URL, "migration");
const isolated = openDatabase(process.env.TEST_ISOLATION_DATABASE_URL);
const catalog = catalogService(app.db);
const requests = requestService(app.db);
const customer = {
  name: "Fictional Example Person",
  phone: "+1 (202) 555-0100",
  email: "FICTIONAL@example.com",
};
const serviceInput = {
  slug: "foundation-consultation",
  title: "Fictional consultation",
  description: "Fictional service for database verification only.",
  enabled: true,
  published: true,
};
let serviceId = "";
let appointmentId = "";
const rowCount = async (table: typeof customers | typeof appointments | typeof auditEvents) =>
  (await app.db.select({ total: count() }).from(table))[0].total;

beforeAll(async () => {
  await app.client`select 1`;
  await admin.client`select 1`;
  await isolated.client`select 1`;
});
afterAll(async () => {
  await Promise.all([app.close(), admin.close(), isolated.close()]);
});

describe("PostgreSQL foundation", () => {
  it("connects using a restricted runtime role and a separate test database", async () => {
    const [identity] =
      await app.client`select current_user as role, current_database() as database`;
    expect(identity.role).toBe("healthcare_app");
    expect(identity.database).toMatch(/^healthcare_phase5_test_/);
    const [role] =
      await admin.client`select rolsuper, rolcreatedb, rolcreaterole, rolbypassrls, rolinherit from pg_roles where rolname = 'healthcare_app'`;
    expect(Object.values(role)).toEqual([false, false, false, false, false]);
  });
  it("migrates a fresh database and safely replays its journal", async () => {
    await migrateDatabase(admin.db);
    expect((await admin.client`select * from drizzle.__drizzle_migrations`).length).toBe(9);
    const tables =
      await admin.client`select tablename, rowsecurity from pg_tables where schemaname = 'healthcare'`;
    expect(tables).toHaveLength(15);
    expect(tables.every((table) => table.rowsecurity)).toBe(true);
    expect(
      (await app.client`select key from healthcare.administrative_roles order by key`).map(
        (r) => r.key,
      ),
    ).toEqual(["owner", "receptionist"]);
    expect(await app.client`select * from healthcare.administrative_users`).toHaveLength(0);
  });
  it("stores singleton business settings and updates them with an audit", async () => {
    const input = {
      profileId: "default",
      name: "Fictional Test Business",
      businessType: "home-healthcare",
      timezone: "Asia/Karachi",
      theme: "clinical-blue",
    };
    await catalog.saveSettings(input);
    await catalog.saveSettings({ ...input, name: "Fictional Updated Business" });
    expect((await catalog.getSettings())?.name).toBe("Fictional Updated Business");
    expect(await app.client`select * from healthcare.business_settings`).toHaveLength(1);
    await expect(
      app.client`insert into healthcare.business_settings (id, profile_id, name, business_type, theme) values (2, 'bad', 'Bad example', 'home-healthcare', 'clinical-blue')`,
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("serializes concurrent migration writers", async () => {
    const other = openDatabase(process.env.TEST_MIGRATION_URL, "migration");
    try {
      await Promise.all([migrateDatabase(admin.db), migrateDatabase(other.db)]);
    } finally {
      await other.close();
    }
    expect(await admin.client`select * from drizzle.__drizzle_migrations`).toHaveLength(9);
  });
  it("fails closed when a deployment selects another business database", async () => {
    await expect(backendForDeployment(app.db, "general-clinic")).rejects.toMatchObject({
      code: "CONFIGURATION",
    });
    const backend = await backendForDeployment(app.db, "default");
    expect((await backend.catalog.getSettings())?.profileId).toBe("default");
  });
  it("refuses altered migration history", async () => {
    const [row] =
      await admin.client`select id, hash from drizzle.__drizzle_migrations order by id limit 1`;
    await admin.client`update drizzle.__drizzle_migrations set hash = 'fixture-tampered-hash' where id = ${row.id}`;
    try {
      await expect(migrateDatabase(admin.db)).rejects.toThrow("migration history");
    } finally {
      await admin.client`update drizzle.__drizzle_migrations set hash = ${row.hash} where id = ${row.id}`;
    }
  });
  it("creates, reads, replaces and deletes service content with active filtering", async () => {
    const row = await catalog.createService(serviceInput);
    serviceId = row.id;
    const hidden = await catalog.createService({
      ...serviceInput,
      slug: "hidden-service",
      published: false,
    });
    expect((await catalog.listPublishedServices()).map((s) => s.id)).toEqual([serviceId]);
    expect(
      await catalog.replaceService(hidden.id, {
        ...serviceInput,
        slug: "hidden-service",
        enabled: false,
      }),
    ).toMatchObject({ enabled: false });
    await catalog.deleteService(hidden.id);
    await expect(catalog.deleteService(hidden.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const duplicateError = await catalog
      .createService(serviceInput)
      .catch((e: unknown) => safeError(e));
    expect(duplicateError).toBeInstanceOf(BackendError);
    expect(duplicateError).toMatchObject({ code: "CONFLICT" });
  });
  it("supports page CRUD and exposes only published projections", async () => {
    const input = {
      slug: "test-page",
      title: "Fictional information",
      description: "Testing only.",
      content: [{ type: "paragraph", text: "Fictional plain-text page content." }],
    };
    const page = await catalog.createPage(input);
    expect(await catalog.getPublishedPage(input.slug)).toBeNull();
    await catalog.replacePage(page.id, { ...input, published: true });
    expect(await catalog.getPublishedPage(input.slug)).toEqual({
      slug: input.slug,
      title: input.title,
      description: input.description,
      content: input.content,
    });
    await catalog.deletePage(page.id);
    expect(await catalog.getPublishedPage(input.slug)).toBeNull();
  });
  it("supports customer CRUD without assuming shared phone/email means the same person", async () => {
    const first = await requests.createCustomer(customer);
    const second = await requests.createCustomer(customer);
    expect(first.id).not.toBe(second.id);
    expect(await requests.getCustomer(first.id)).toMatchObject({
      phone: "+12025550100",
      email: "fictional@example.com",
    });
    const updated = await requests.replaceCustomer(first.id, {
      ...customer,
      name: "Fictional Updated Person",
    });
    expect(updated.updatedAt.valueOf()).toBeGreaterThanOrEqual(updated.createdAt.valueOf());
    await requests.deleteCustomer(first.id);
    await requests.deleteCustomer(second.id);
    expect(await requests.getCustomer(first.id)).toBeNull();
  });
  it("atomically commits a new request, customer and redacted audit events", async () => {
    const before = {
      customers: await rowCount(customers),
      appointments: await rowCount(appointments),
      audit: await rowCount(auditEvents),
    };
    const request = await requests.createAppointmentRequest({
      customer,
      serviceId,
      preferredDate: "2099-01-01",
      timeWindow: "No preference",
      visitMode: "clinic",
      consent: true,
    });
    appointmentId = request.id;
    expect(Object.keys(request).sort()).toEqual(["id", "reference", "status"]);
    expect(request.reference).toMatch(/^REQ-[A-F0-9]{24}$/);
    expect(request.status).toBe("new");
    expect(await rowCount(customers)).toBe(before.customers + 1);
    expect(await rowCount(appointments)).toBe(before.appointments + 1);
    expect(await rowCount(auditEvents)).toBe(before.audit + 2);
    const detail = await requests.getAppointment(request.id);
    expect(detail?.customer.name).toBe(customer.name);
    expect(detail?.service.slug).toBe(serviceInput.slug);
    expect(detail?.confirmedAt).toBeNull();
  });
  it("rejects deleting referenced records and never grants appointment/inquiry hard deletion", async () => {
    const appointment = await requests.getAppointment(appointmentId);
    await expect(catalog.deleteService(serviceId)).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(requests.deleteCustomer(appointment!.customerId)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(app.client`delete from healthcare.appointments`).rejects.toMatchObject({
      code: "42501",
    });
    await expect(app.client`delete from healthcare.contact_inquiries`).rejects.toMatchObject({
      code: "42501",
    });
    expect(await requests.getAppointment(appointmentId)).not.toBeNull();
  });
  it("rejects missing or disabled services without leaving customers behind", async () => {
    const before = await rowCount(customers);
    const disabled = await catalog.createService({
      ...serviceInput,
      slug: "disabled-service",
      enabled: false,
    });
    for (const id of [disabled.id, randomUUID()])
      await expect(
        requests.createAppointmentRequest({
          customer,
          serviceId: id,
          preferredDate: "2099-01-01",
          timeWindow: "No preference",
          visitMode: "home",
          consent: true,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await rowCount(customers)).toBe(before);
  });
  it("rolls back the entire real request when audit persistence fails", async () => {
    const before = [
      await rowCount(customers),
      await rowCount(appointments),
      await rowCount(auditEvents),
    ];
    await admin.client.unsafe(
      `CREATE FUNCTION healthcare.qa_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.entity_type = 'appointment' THEN RAISE EXCEPTION 'Injected fixture failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER qa_fail_audit BEFORE INSERT ON healthcare.audit_events FOR EACH ROW EXECUTE FUNCTION healthcare.qa_fail_audit();`,
    );
    try {
      await expect(
        requests.createAppointmentRequest({
          customer,
          serviceId,
          preferredDate: "2099-01-01",
          timeWindow: "No preference",
          visitMode: "clinic",
          consent: true,
        }),
      ).rejects.toMatchObject({ code: "INTERNAL" });
      expect([
        await rowCount(customers),
        await rowCount(appointments),
        await rowCount(auditEvents),
      ]).toEqual(before);
    } finally {
      await admin.client.unsafe(
        `DROP TRIGGER qa_fail_audit ON healthcare.audit_events; DROP FUNCTION healthcare.qa_fail_audit();`,
      );
    }
  });
  it("generates distinct references for concurrent transactions", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        requests.createAppointmentRequest({
          customer,
          serviceId,
          preferredDate: "2099-01-02",
          timeWindow: "No preference",
          visitMode: "online",
          consent: true,
        }),
      ),
    );
    expect(new Set(results.map((r) => r.reference)).size).toBe(5);
  });
  it("creates, reads and updates inquiries with bounded reads", async () => {
    const result = await requests.createInquiry({
      name: customer.name,
      email: "fictional@example.com",
      subject: "Fixture question",
      message: "Fictional inquiry for automated verification only.",
    });
    expect(result.status).toBe("new");
    expect(await requests.setInquiryStatus(result.id, "read")).toMatchObject({ status: "read" });
    expect((await requests.listInquiries()).some((row) => row.id === result.id)).toBe(true);
    await expect(requests.setInquiryStatus(result.id, "unknown")).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });
  it("enforces database checks, foreign keys, enum and uniqueness even without Zod", async () => {
    await expect(
      app.client`insert into healthcare.customers (name,phone) values ('', 'invalid')`,
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      app.client`insert into healthcare.customers (name,phone,email) values ('Fictional Person', '+12025550100', 'invalid')`,
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      app.client`insert into healthcare.services (slug,title,description,display_order) values ('bad slug', 'Example', 'Fixture', -1)`,
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      app.client`insert into healthcare.appointments (reference,customer_id,service_id,preferred_date,time_window,visit_mode) values ('REQ-AAAAAAAAAAAAAAAAAAAAAAAA', ${randomUUID()}, ${serviceId}, '2099-01-01', 'Any', 'home')`,
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      app.client`update healthcare.appointments set status = 'invalid' where id = ${appointmentId}`,
    ).rejects.toMatchObject({ code: "22P02" });
    await expect(
      app.client`update healthcare.appointments set status = 'confirmed' where id = ${appointmentId}`,
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      app.client`insert into healthcare.contact_inquiries (name,email,subject,message) values ('Example', 'fixture@example.com', 'Example', 'short')`,
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("restricts DDL, role mutation, membership mutation, migration metadata and audit modification", async () => {
    for (const query of [
      "create table healthcare.forbidden (id int)",
      "update healthcare.administrative_users set active = true",
      "insert into healthcare.administrative_roles values ('owner2', 'Invalid')",
      "delete from healthcare.audit_events",
      "update healthcare.audit_events set action = 'deleted'",
      "select * from drizzle.__drizzle_migrations",
    ]) {
      await expect(app.client.unsafe(query), query).rejects.toMatchObject({ code: "42501" });
    }
  });
  it("keeps private tables unavailable to Supabase browser/API roles", async () => {
    for (const role of ["anon", "authenticated", "service_role"]) {
      const [access] =
        await admin.client`select has_schema_privilege(${role}, 'healthcare', 'USAGE') as allowed`;
      expect(access.allowed).toBe(false);
      await expect(
        admin.client.begin(async (tx) => {
          await tx.unsafe(`set local role ${role}`);
          await tx`select * from healthcare.customers`;
        }),
      ).rejects.toMatchObject({ code: "42501" });
    }
  });
  it("never persists form contents in audit metadata", async () => {
    const rows = await app.db.select().from(auditEvents);
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every(
        (row) =>
          ["foundation", "fixture"].includes(row.metadata.source) &&
          Object.keys(row.metadata).length === 1,
      ),
    ).toBe(true);
    await expect(
      app.client`insert into healthcare.audit_events (action, entity_type, entity_id, metadata) values ('created', 'customer', 'fixture', '{"name":"private"}'::jsonb)`,
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("isolates client databases and loads repeatable, insert-only fictional fixtures", async () => {
    expect(await isolated.db.select().from(services)).toHaveLength(0);
    expect((await catalog.listPublishedServices()).some((s) => s.id === serviceId)).toBe(true);
    const races = await Promise.allSettled([
      seedDemoProfile(isolated.db, "general-clinic"),
      seedDemoProfile(isolated.db, "home-care"),
    ]);
    expect(races.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(races.filter((result) => result.status === "rejected")).toHaveLength(1);
    const winner = races.find((result) => result.status === "fulfilled");
    if (winner?.status !== "fulfilled") throw new Error("Fixture seed did not complete.");
    const rows = await isolated.db.select().from(services);
    await seedDemoProfile(isolated.db, winner.value.profile);
    expect(await isolated.db.select().from(services)).toHaveLength(rows.length);
    expect(await catalogService(isolated.db).listPublishedServices()).toHaveLength(
      winner.value.services,
    );
    expect(await isolated.db.select().from(customers)).toHaveLength(0);
    await expect(seedDemoProfile(isolated.db, "default")).rejects.toThrow("another profile");
    expect(
      await app.db
        .select()
        .from(services)
        .where(and(eq(services.slug, "general-consultation"), eq(services.enabled, true))),
    ).toHaveLength(0);
  });
  it("uses the database trigger for updated timestamps", async () => {
    const [before] =
      await app.client`select updated_at from healthcare.services where id = ${serviceId}`;
    await app.db.execute(sql`select pg_sleep(0.01)`);
    const [after] =
      await app.client`update healthcare.services set title = 'Fictional updated service' where id = ${serviceId} returning updated_at`;
    expect(new Date(after.updated_at).valueOf()).toBeGreaterThan(
      new Date(before.updated_at).valueOf(),
    );
  });
});

describe("validation, configuration and safe errors", () => {
  it("normalizes customer input and rejects fields not in the contract", () => {
    expect(customerSchema.parse(customer)).toMatchObject({
      phone: "+12025550100",
      email: "fictional@example.com",
    });
    expect(customerSchema.safeParse({ ...customer, role: "owner" }).success).toBe(false);
    expect(
      contentSchema.safeParse([{ type: "html", text: "<script>example</script>" }]).success,
    ).toBe(false);
    expect(
      appointmentSchema.safeParse({
        customer,
        serviceId: randomUUID(),
        preferredDate: "2099-02-30",
        timeWindow: "Any",
        visitMode: "clinic",
        consent: true,
      }).success,
    ).toBe(false);
  });
  it("rejects invalid service writes before mutation", async () => {
    await expect(catalog.createService({ ...serviceInput, title: "" })).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
    await expect(
      catalog.createService({ ...serviceInput, slug: "invalid slug" }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(
      requests.createInquiry({ name: "X", email: "invalid", subject: "", message: "short" }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
  it("requires runtime and migration credentials to be distinct and keeps TLS verification", () => {
    expect(() => connectionSettings(undefined, "runtime")).toThrow(BackendError);
    expect(() =>
      connectionSettings("postgresql://postgres:example@localhost/test", "runtime"),
    ).toThrow(BackendError);
    expect(() =>
      connectionSettings("postgresql://postgres:example@db.example.com:6543/test", "migration"),
    ).toThrow(BackendError);
    expect(() =>
      connectionSettings(
        "postgresql://healthcare_app:example@db.example.com/test?sslmode=disable",
        "runtime",
      ),
    ).toThrow(BackendError);
    const settings = connectionSettings(
      "postgresql://healthcare_app:example@db.example.com/test",
      "runtime",
    );
    expect(settings).toMatchObject({ prepare: false, max: 5, ssl: { rejectUnauthorized: true } });
  });
  it("refuses unsafe test targets and the application's own database even with different credentials", () => {
    expect(() =>
      assertTestDatabase("postgresql://postgres:example@db.example.com/healthcare_test"),
    ).toThrow(BackendError);
    expect(() => assertTestDatabase("postgresql://postgres:example@localhost/production")).toThrow(
      BackendError,
    );
    expect(() =>
      assertTestDatabase("postgresql://postgres:example@localhost/healthcare_test", [
        "postgresql://healthcare_app:different@127.0.0.1:5432/healthcare_test",
      ]),
    ).toThrow(BackendError);
  });
  it("returns structured errors without SQL, credentials, fields or raw causes", async () => {
    expect(safeError({ code: "23001" }).code).toBe("CONFLICT");
    expect(safeError({ code: "23503" }).code).toBe("CONFLICT");
    const sentinel = "SECRET_FIXTURE_SENTINEL";
    for (const error of [
      new Error(`password=${sentinel}`),
      { cause: { code: "23505", detail: sentinel, query: "select private_data" } },
      { code: "ECONNREFUSED", message: sentinel },
    ]) {
      const safe = publicError(error, "request-example");
      expect(JSON.stringify(safe)).not.toContain(sentinel);
      expect(JSON.stringify(safe)).not.toContain("private_data");
      expect(safe.error.requestId).toBe("request-example");
      expect(safe.status).toBeGreaterThanOrEqual(400);
    }
    await expect(
      operation(async () => {
        throw { code: "ECONNREFUSED", message: sentinel };
      }),
    ).rejects.toMatchObject({ code: "UNAVAILABLE", status: 503 });
  });
});
