import { beforeAll, beforeEach, afterAll, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { openDatabase } from "../../src/server/db/connection";
import { assertTestDatabase } from "../../src/server/env";
import { seedDemoProfile } from "../../src/server/db/fixtures";
import { initializeCms, cmsStore } from "../../src/server/cms/store";
import { readPublishedWebsite } from "../../src/server/cms/public";
import { prepareImage, uploadMedia, readMedia } from "../../src/server/cms/media";
import { operationsStore } from "../../src/server/admin/operations";
import { requestService } from "../../src/server/services/requests";
import { csvCell } from "../../src/types/operations";
import {
  validateDocument,
  initialDocument,
  contentPatchSchema,
} from "../../src/server/cms/validation";
import type { AdminIdentity } from "../../src/types/admin-auth";
import { persistSubmission } from "../../src/server/submissions/store";
import { submissionPolicy } from "../../src/server/submissions/config";
for (const key of ["TEST_MANAGEMENT_DATABASE_URL", "TEST_MANAGEMENT_MIGRATION_URL"])
  assertTestDatabase(process.env[key], [process.env.DATABASE_URL, process.env.DIRECT_URL]);
const app = openDatabase(process.env.TEST_MANAGEMENT_DATABASE_URL),
  admin = openDatabase(process.env.TEST_MANAGEMENT_MIGRATION_URL, "migration");
const issuer = "http://127.0.0.1:54321/auth/v1";
const owner: AdminIdentity = {
  userId: randomUUID(),
  role: "owner",
  issuer,
  aal: "aal2",
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
};
const staff: AdminIdentity = { ...owner, userId: randomUUID(), role: "receptionist" };
const ops = operationsStore(app.db, owner),
  reception = operationsStore(app.db, staff),
  cms = cmsStore(app.db, owner);
let id = "",
  customerId = "",
  inquiryId = "";
beforeAll(async () => {
  await app.client`select 1`;
});
beforeEach(async () => {
  vi.unstubAllEnvs();
  await admin.client`truncate healthcare.business_settings,healthcare.services,healthcare.pages,healthcare.cms_state,healthcare.media_assets,healthcare.customers,healthcare.administrative_users cascade`;
  await seedDemoProfile(admin.db, "default");
  await admin.client`insert into healthcare.administrative_users(user_id,role_key,active,auth_issuer) values(${owner.userId},'owner',true,${issuer}),(${staff.userId},'receptionist',true,${issuer})`;
  await initializeCms(admin.db);
  const [service] =
    await app.client`select id from healthcare.services where enabled and published limit 1`;
  const r = await requestService(app.db).createAppointmentRequest({
    serviceId: service.id,
    customer: {
      name: "Fictional Workflow Person",
      phone: "+12025550123",
      email: "workflow@example.com",
    },
    preferredDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    timeWindow: "No preference",
    visitMode: "home",
    consent: true,
  });
  id = r.id;
  const [a] = await app.client`select customer_id from healthcare.appointments where id=${id}`;
  customerId = a.customer_id;
  const inquiry = await requestService(app.db).createInquiry({
    name: "Fictional Inquiry Person",
    email: "inquiry@example.com",
    subject: "Scheduling question",
    message: "Please explain the fictional service process.",
  });
  inquiryId = inquiry.id;
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await Promise.all([app.close(), admin.close()]);
});
it("excludes disabled service content and unused images from public responses until enabled", async () => {
  const bytes = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#123456" },
  })
    .png()
    .toBuffer();
  const media = await uploadMedia(app.db, owner, bytes);
  let state = await cms.read();
  const service = {
    ...state.draft.services[0],
    slug: "private-disabled-care",
    title: "Unreleased private service",
    image: media.path,
    related: [],
    enabled: false,
  };
  state = await cms.saveService({ revision: state.revision, originalSlug: null, service });
  const parent = state.draft.services.find((item) => item.enabled)!;
  state = await cms.saveService({
    revision: state.revision,
    originalSlug: parent.slug,
    service: { ...parent, related: [...parent.related, service.slug] },
  });
  await cms.publish({ revision: state.revision });
  expect(JSON.stringify(await readPublishedWebsite(app.db))).not.toContain(
    "Unreleased private service",
  );
  const snapshot = JSON.stringify(await readPublishedWebsite(app.db));
  expect(snapshot).not.toContain(service.slug);
  expect(snapshot).not.toContain(media.path);
  await expect(readMedia(app.db, media.path.slice(11))).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  expect((await cms.read()).draft.services.some((s) => s.slug === service.slug)).toBe(true);
  state = await cms.saveService({
    revision: state.revision,
    originalSlug: service.slug,
    service: { ...service, enabled: true },
  });
  await cms.publish({ revision: state.revision });
  expect((await readPublishedWebsite(app.db)).services.some((s) => s.slug === service.slug)).toBe(
    true,
  );
  expect((await readMedia(app.db, media.path.slice(11))).publishedAt).not.toBeNull();
});
it("changes public booking eligibility only when the new catalog is published", async () => {
  vi.stubEnv("CMS_MODE", "database");
  let state = await cms.read();
  const service = {
    ...state.draft.services[0],
    slug: "new-bookable-care",
    related: [],
    enabled: true,
  };
  state = await cms.saveService({ revision: state.revision, originalSlug: null, service });
  const policy = submissionPolicy({
    SUBMISSIONS_MODE: "local-test",
    TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    SUBMISSIONS_HMAC_SECRET: "f".repeat(64),
    SUBMISSION_ALLOWED_ORIGINS: "http://127.0.0.1:3104",
  });
  const submit = () =>
    persistSubmission({
      db: app.db,
      kind: "appointment",
      key: randomUUID(),
      client: randomUUID(),
      policy,
      verify: async () => {},
      values: {
        service: service.slug,
        name: "Fictional New Booking",
        phone: "+12025550199",
        email: "new-booking@example.com",
        date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        time: "No preference",
        visitMode: "home",
        inquiry: "",
        consent: true,
        website: "",
        turnstileToken: "test",
      },
    });
  await expect(submit()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  await cms.publish({ revision: state.revision });
  expect((await submit()).receipt.status).toBe("new");
  state = await cms.archiveService({ revision: state.revision, slug: service.slug });
  await cms.publish({ revision: state.revision });
  await expect(submit()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
});
it("rolls back the live catalog, image visibility and snapshot when publication audit fails", async () => {
  const original = await readPublishedWebsite(app.db);
  const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: "#123456" } })
    .png()
    .toBuffer();
  const media = await uploadMedia(app.db, owner, png);
  let state = await cms.read();
  state = await cms.saveBrand({
    revision: state.revision,
    brand: {
      ...state.draft.brand,
      name: "Must roll back",
      logo: { src: media.path, alt: "New image" },
    },
  });
  await admin.client.unsafe(
    "CREATE FUNCTION healthcare.reject_publication() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='published' THEN RAISE EXCEPTION 'fixture'; END IF; RETURN NEW; END $$; CREATE TRIGGER fixture_publication BEFORE INSERT ON healthcare.audit_events FOR EACH ROW EXECUTE FUNCTION healthcare.reject_publication()",
  );
  try {
    await expect(cms.publish({ revision: state.revision })).rejects.toMatchObject({
      code: "INTERNAL",
    });
    expect((await readPublishedWebsite(app.db)).site.name).toBe(original.site.name);
    expect((await app.client`select name from healthcare.business_settings`)[0].name).toBe(
      original.site.name,
    );
    await expect(readMedia(app.db, media.path.slice(11))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  } finally {
    await admin.client.unsafe(
      "DROP TRIGGER fixture_publication ON healthcare.audit_events; DROP FUNCTION healthcare.reject_publication()",
    );
  }
});
it("serializes competing CMS edits and validates pagination limits", async () => {
  const state = await cms.read();
  const results = await Promise.allSettled([
    cms.saveBrand({
      revision: state.revision,
      brand: { ...state.draft.brand, name: "First edit" },
    }),
    cms.saveBrand({
      revision: state.revision,
      brand: { ...state.draft.brand, name: "Other edit" },
    }),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.find((r) => r.status === "rejected")).toMatchObject({
    reason: { code: "CONFLICT" },
  });
  await expect(ops.listAppointments({ page: 0 })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  await expect(ops.listInquiries({ q: "x".repeat(101) })).rejects.toMatchObject({
    code: "INVALID_INPUT",
  });
});
it("reads new public requests with a starting history event and searchable dashboard", async () => {
  expect((await ops.dashboard()).recent[0].id).toBe(id);
  expect((await ops.listAppointments({ q: "workflow" })).total).toBe(1);
  expect((await ops.appointment(id)).history.items[0].toStatus).toBe("new");
  expect((await ops.inquiry(inquiryId)).history.items).toHaveLength(1);
});
it("limits receptionist lists, customer access, direct IDs and mutations to assigned records", async () => {
  expect((await reception.listAppointments({})).total).toBe(0);
  expect((await reception.listCustomers({})).total).toBe(0);
  for (const work of [
    () => reception.appointment(id),
    () => reception.customer(customerId),
    () => reception.inquiry(inquiryId),
    () => reception.changeAppointment(id, { action: "note", version: 0, note: "No access" }),
  ])
    await expect(work()).rejects.toMatchObject({ code: "NOT_FOUND" });
  await ops.changeAppointment(id, { action: "assign", version: 0, assignedTo: staff.userId });
  expect((await reception.listAppointments({})).total).toBe(1);
  expect((await reception.customer(customerId)).record.name).toContain("Fictional");
  await expect(
    reception.changeAppointment(id, { action: "assign", version: 1, assignedTo: null }),
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(reception.listAppointments({}, true)).rejects.toMatchObject({ code: "FORBIDDEN" });
});
it("records notes and status transitions atomically, requires confirmed time, prevents invalid completion", async () => {
  await expect(
    ops.changeAppointment(id, { action: "status", version: 0, status: "completed" }),
  ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  await expect(
    ops.changeAppointment(id, { action: "status", version: 0, status: "confirmed" }),
  ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  await ops.changeAppointment(id, {
    action: "status",
    version: 0,
    status: "confirmed",
    confirmedAt: new Date(Date.now() + 3600000).toISOString(),
  });
  await expect(
    ops.changeAppointment(id, { action: "status", version: 1, status: "completed" }),
  ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  await ops.changeAppointment(id, {
    action: "note",
    version: 1,
    note: "Call tomorrow about scheduling.",
  });
  const record = await ops.appointment(id);
  expect(record.record.version).toBe(2);
  expect(record.history.items).toHaveLength(3);
});
it("serializes stale concurrent updates without losing a status or activity entry", async () => {
  const result = await Promise.allSettled([
    ops.changeAppointment(id, { action: "status", version: 0, status: "contacted" }),
    ops.changeAppointment(id, { action: "status", version: 0, status: "cancelled" }),
  ]);
  expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(result.find((r) => r.status === "rejected")).toMatchObject({
    reason: { code: "CONFLICT" },
  });
  expect((await ops.appointment(id)).history.items).toHaveLength(2);
});
it("allows only Owner reopening with a reason and immediately revokes reassigned staff access", async () => {
  await ops.changeAppointment(id, { action: "assign", version: 0, assignedTo: staff.userId });
  await reception.changeAppointment(id, { action: "status", version: 1, status: "cancelled" });
  await expect(
    reception.changeAppointment(id, {
      action: "status",
      version: 2,
      status: "new",
      note: "Please reopen",
    }),
  ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  await ops.changeAppointment(id, {
    action: "status",
    version: 2,
    status: "new",
    note: "Customer requested follow-up",
  });
  await ops.changeAppointment(id, { action: "assign", version: 3, assignedTo: null });
  await expect(reception.appointment(id)).rejects.toMatchObject({ code: "NOT_FOUND" });
});
it("updates customers and inquiry assignments/status/history with optimistic versions", async () => {
  await ops.changeCustomer(customerId, {
    version: 0,
    customer: { name: "Updated Fictional Name", phone: "+12025550124", email: null },
  });
  await expect(
    ops.changeCustomer(customerId, {
      version: 0,
      customer: { name: "Old", phone: "+12025550124" },
    }),
  ).rejects.toMatchObject({ code: "CONFLICT" });
  expect((await ops.customer(customerId)).record.name).toBe("Updated Fictional Name");
  await ops.changeInquiry(inquiryId, { action: "assign", version: 0, assignedTo: staff.userId });
  await reception.changeInquiry(inquiryId, { action: "status", version: 1, status: "read" });
  await reception.changeInquiry(inquiryId, {
    action: "note",
    version: 2,
    note: "Follow up tomorrow",
  });
  expect((await reception.inquiry(inquiryId)).history.items).toHaveLength(4);
});
it("revalidates active role, issuer, expiry and profile inside management transactions", async () => {
  for (const actor of [
    { ...owner, issuer: "https://other.example/auth/v1" },
    { ...owner, role: "receptionist" as const },
    { ...owner, expiresAt: "2000-01-01T00:00:00Z" },
  ])
    await expect(operationsStore(app.db, actor).dashboard()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  await admin.client`update healthcare.administrative_users set active=false where user_id=${staff.userId}`;
  await expect(reception.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
  await admin.client`update healthcare.business_settings set profile_id='different'`;
  await expect(ops.dashboard()).rejects.toMatchObject({ code: "CONFIGURATION" });
});
it("keeps drafts private until a single atomic publication updates brand, catalog and public copy", async () => {
  const before = await readPublishedWebsite(app.db);
  let state = await cms.read();
  state = await cms.saveBrand({
    revision: state.revision,
    brand: { ...state.draft.brand, name: "Fictional Published Care", theme: "soft-teal" },
  });
  expect((await readPublishedWebsite(app.db)).site.name).toBe(before.site.name);
  await cms.publish({ revision: state.revision });
  const after = await readPublishedWebsite(app.db);
  expect(after.site.name).toBe("Fictional Published Care");
  expect(after.theme).toBe("soft-teal");
  expect((await app.client`select name from healthcare.business_settings`)[0].name).toBe(
    after.site.name,
  );
});
it("creates, reorders, disables and removes services without altering historical appointments", async () => {
  let state = await cms.read();
  const added = {
    ...state.draft.services[0],
    slug: "fictional-new-service",
    title: "New Fictional Service",
    enabled: true,
    related: [],
  };
  state = await cms.saveService({ revision: state.revision, originalSlug: null, service: added });
  expect((await readPublishedWebsite(app.db)).services.some((s) => s.slug === added.slug)).toBe(
    false,
  );
  state = await cms.reorder({
    revision: state.revision,
    slugs: [
      added.slug,
      ...state.draft.services.filter((s) => s.slug !== added.slug).map((s) => s.slug),
    ],
  });
  await cms.publish({ revision: state.revision });
  expect((await readPublishedWebsite(app.db)).services[0].slug).toBe(added.slug);
  const [dbService] = await app.client`select * from healthcare.services where slug=${added.slug}`;
  expect(dbService.published).toBe(true);
  state = await cms.archiveService({ revision: state.revision, slug: added.slug });
  await cms.publish({ revision: state.revision });
  expect((await readPublishedWebsite(app.db)).services.some((s) => s.slug === added.slug)).toBe(
    false,
  );
  state = await cms.removeService({ revision: state.revision, slug: added.slug });
  await cms.publish({ revision: state.revision });
  expect((await ops.appointment(id)).record.id).toBe(id);
});
it("rejects Receptionist CMS access, stale edits, invalid media and incomplete publication without partial writes", async () => {
  await expect(cmsStore(app.db, staff).read()).rejects.toMatchObject({ code: "FORBIDDEN" });
  let state = await cms.read();
  state = await cms.saveBrand({
    revision: state.revision,
    brand: { ...state.draft.brand, name: "Unpublished" },
  });
  await expect(cms.saveBrand({ revision: 0, brand: state.draft.brand })).rejects.toMatchObject({
    code: "CONFLICT",
  });
  state = await cms.saveBrand({
    revision: state.revision,
    brand: {
      ...state.draft.brand,
      logo: { src: `/api/media/${randomUUID()}`, alt: "Missing logo" },
    },
  });
  await expect(cms.publish({ revision: state.revision })).rejects.toMatchObject({
    code: "PUBLICATION_INVALID",
  });
  expect((await readPublishedWebsite(app.db)).site.name).not.toBe("Unpublished");
  const reverted = await cms.discard({ revision: state.revision });
  expect(reverted.revision).toBe(reverted.publishedRevision);
});
it("only permits editable content keys and local media paths; validates all fixture content", () => {
  expect(() => validateDocument(initialDocument())).not.toThrow();
  expect(
    contentPatchSchema.safeParse({
      revision: 0,
      page: "home",
      copy: { submission_received: "Fake confirmation" },
    }).success,
  ).toBe(false);
  expect(
    contentPatchSchema.safeParse({
      revision: 0,
      page: "about",
      copy: {},
      sections: initialDocument().sections,
    }).success,
  ).toBe(false);
});
it("reencodes private raster media, strips metadata, and publishes only referenced images", async () => {
  const input = await sharp({
    create: { width: 1200, height: 700, channels: 3, background: "#274b57" },
  })
    .jpeg()
    .withMetadata()
    .toBuffer();
  const media = await uploadMedia(app.db, owner, input, true);
  const mediaId = media.path.slice(11);
  await expect(readMedia(app.db, mediaId)).rejects.toMatchObject({ code: "NOT_FOUND" });
  const row = await readMedia(app.db, mediaId, owner);
  const metadata = await sharp(Buffer.from(row.data, "base64")).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(512);
  expect(metadata.exif).toBeUndefined();
  let state = await cms.read();
  state = await cms.saveBrand({
    revision: state.revision,
    brand: { ...state.draft.brand, logo: { src: media.path, alt: "Fictional logo" } },
  });
  await cms.publish({ revision: state.revision });
  expect((await readMedia(app.db, mediaId)).publishedAt).not.toBeNull();
  await expect(
    app.client`update healthcare.media_assets set data='changed' where id=${mediaId}`,
  ).rejects.toMatchObject({ code: "42501" });
});
it("rejects SVG, malformed images, pixel bombs and oversized uploads", async () => {
  for (const bytes of [
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    Buffer.from("not an image"),
  ])
    await expect(prepareImage(bytes)).rejects.toMatchObject({ code: "INVALID_IMAGE" });
  await expect(prepareImage(Buffer.alloc(2097153))).rejects.toMatchObject({
    code: "PAYLOAD_TOO_LARGE",
  });
  const huge = await sharp({ create: { width: 4097, height: 1, channels: 3, background: "#fff" } })
    .png()
    .toBuffer();
  await expect(prepareImage(huge)).rejects.toMatchObject({ code: "INVALID_IMAGE" });
});
it("preserves append-only history and private API-role/RLS boundaries for all new tables", async () => {
  await expect(
    app.client`update healthcare.workflow_events set note='tampered'`,
  ).rejects.toMatchObject({ code: "42501" });
  await expect(app.client`delete from healthcare.workflow_events`).rejects.toMatchObject({
    code: "42501",
  });
  for (const table of ["cms_state", "media_assets", "workflow_events"])
    for (const role of ["anon", "authenticated", "service_role"]) {
      const [r] =
        await admin.client`select has_table_privilege(${role},${"healthcare." + table},'SELECT') as allowed`;
      expect(r.allowed).toBe(false);
    }
});
it("exports quoted cells with formula escaping, including phone numbers and control characters", () => {
  for (const value of ["=1+1", "+12025550123", "  @SUM(A1)", "\t-2", '\r=HYPERLINK("x")'])
    expect(csvCell(value)).toMatch(/^"'/);
  expect(csvCell('Jane "Example"')).toBe('"Jane ""Example"""');
});
