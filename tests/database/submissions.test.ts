import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { openDatabase } from "../../src/server/db/connection";
import { seedDemoProfile } from "../../src/server/db/fixtures";
import { assertTestDatabase } from "../../src/server/env";
import { handleSubmission } from "../../src/server/submissions/http";
import { submissionPolicy, testSiteKey, testSecretKey } from "../../src/server/submissions/config";
import { verifyTurnstile } from "../../src/server/submissions/turnstile";
import { takeRateLimit, digest } from "../../src/server/submissions/store";
import { validatePreferredDate } from "../../src/server/submissions/validation";
import type { SubmissionKind } from "../../src/types/submission";

assertTestDatabase(process.env.TEST_SUBMISSION_DATABASE_URL);
assertTestDatabase(process.env.TEST_SUBMISSION_MIGRATION_URL);
const app = openDatabase(process.env.TEST_SUBMISSION_DATABASE_URL);
const admin = openDatabase(process.env.TEST_SUBMISSION_MIGRATION_URL, "migration");
const baseEnv = {
  SUBMISSIONS_MODE: "local-test",
  TURNSTILE_SITE_KEY: testSiteKey,
  TURNSTILE_SECRET_KEY: testSecretKey,
  SUBMISSIONS_HMAC_SECRET: "f".repeat(64),
  SUBMISSION_ALLOWED_ORIGINS: "http://127.0.0.1:3102",
  TRUSTED_CLIENT_IP_HEADER: "x-real-ip",
};
const policy = submissionPolicy(baseEnv);
let sequence = 100;
function appointment() {
  const n = sequence++;
  return {
    service: "physiotherapy",
    name: "Fictional Test Person",
    phone: `+1202555${String(n).padStart(4, "0")}`,
    email: `fictional${n}@example.com`,
    date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    time: "No preference",
    visitMode: "home",
    inquiry: "Fictional arrangement question.",
    consent: true,
    website: "",
    turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
  };
}
function inquiry() {
  const n = sequence++;
  return {
    name: "Fictional Test Person",
    email: `fictional${n}@example.com`,
    topic: "care-options",
    message: "Fictional question about service arrangements.",
    consent: true,
    website: "",
    turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
  };
}
function request(
  kind: SubmissionKind,
  body: unknown,
  headers: Record<string, string> = {},
  raw?: string,
) {
  return new Request(
    `http://127.0.0.1:3102/api/${kind === "appointment" ? "appointments" : "inquiries"}`,
    {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:3102",
        "content-type": "application/json",
        "idempotency-key": randomUUID(),
        "x-real-ip": `192.0.2.${(sequence++ % 200) + 1}`,
        ...headers,
      },
      body: raw ?? JSON.stringify(body),
    },
  );
}
const accepted = async () => {};
const handle = (req: Request, kind: SubmissionKind, verify = accepted) =>
  handleSubmission(req, kind, { db: app.db, policy, verify });
const counts = async () => {
  const [r] =
    await app.client`select (select count(*)::int from healthcare.customers) as customers, (select count(*)::int from healthcare.appointments) as appointments, (select count(*)::int from healthcare.contact_inquiries) as inquiries, (select count(*)::int from healthcare.submission_receipts) as receipts, (select count(*)::int from healthcare.audit_events) as audits`;
  return r;
};
beforeAll(async () => {
  await seedDemoProfile(app.db, "default");
});
afterAll(async () => {
  await Promise.all([app.close(), admin.close()]);
});

describe("public submission persistence", () => {
  it("saves validated appointment details, consent, reference, receipt and audits together", async () => {
    const body = appointment();
    const before = await counts();
    const verify = vi.fn(accepted);
    const response = await handle(request("appointment", body), "appointment", verify);
    expect(response.status).toBe(201);
    const receipt = await response.json();
    expect(Object.keys(receipt).sort()).toEqual(["reference", "requestId", "status"]);
    expect(receipt.status).toBe("new");
    expect(receipt.reference).toMatch(/^REQ-[A-F0-9]{24}$/);
    const [record] =
      await app.client`select a.inquiry,a.confirmed_at,c.consent_at,c.phone from healthcare.appointments a join healthcare.customers c on c.id=a.customer_id where a.reference=${receipt.reference}`;
    expect(record.inquiry).toBe(body.inquiry);
    expect(record.confirmed_at).toBeNull();
    expect(record.consent_at).not.toBeNull();
    expect(record.phone).toBe(body.phone);
    const after = await counts();
    expect(after.customers).toBe(before.customers + 1);
    expect(after.appointments).toBe(before.appointments + 1);
    expect(after.receipts).toBe(before.receipts + 1);
    expect(after.audits).toBe(before.audits + 2);
    expect(verify).toHaveBeenCalledTimes(1);
  });
  it("saves contact inquiries and consent without creating a customer", async () => {
    const before = await counts();
    const body = inquiry();
    const response = await handle(request("inquiry", body), "inquiry");
    expect(response.status).toBe(201);
    const receipt = await response.json();
    const [row] =
      await app.client`select name,email,message,consent_at,status from healthcare.contact_inquiries where reference=${receipt.reference}`;
    expect(row).toMatchObject({
      name: body.name,
      email: body.email,
      message: body.message,
      status: "new",
    });
    expect(row.consent_at).not.toBeNull();
    expect((await counts()).customers).toBe(before.customers);
  });
  it("serializes duplicate attempts and returns the original receipt without reverifying a spent token", async () => {
    const body = appointment();
    const key = randomUUID();
    const verify = vi.fn(accepted);
    const before = await counts();
    const responses = await Promise.all([
      handle(request("appointment", body, { "idempotency-key": key }), "appointment", verify),
      handle(request("appointment", body, { "idempotency-key": key }), "appointment", verify),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 201]);
    const receipts = await Promise.all(responses.map((r) => r.json()));
    expect(receipts[0].reference).toBe(receipts[1].reference);
    expect(verify).toHaveBeenCalledTimes(1);
    const replay = await handle(
      request("appointment", body, { "idempotency-key": key }),
      "appointment",
      async () => {
        throw new Error("Must not reverify a committed receipt");
      },
    );
    expect(replay.status).toBe(200);
    expect((await replay.json()).reference).toBe(receipts[0].reference);
    expect((await counts()).appointments).toBe(before.appointments + 1);
    expect(
      (
        await handle(
          request(
            "appointment",
            { ...body, name: "A Different Fictional Person" },
            { "idempotency-key": key },
          ),
          "appointment",
        )
      ).status,
    ).toBe(409);
  });
  it("rolls back customer, request, receipt and audits on persistence failure", async () => {
    const body = appointment();
    const key = randomUUID();
    const before = await counts();
    await admin.client.unsafe(
      "CREATE FUNCTION healthcare.qa_fail_submission() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SENSITIVE_SENTINEL'; END $$; CREATE TRIGGER qa_fail_submission BEFORE INSERT ON healthcare.audit_events FOR EACH ROW EXECUTE FUNCTION healthcare.qa_fail_submission();",
    );
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await handle(
        request("appointment", body, { "idempotency-key": key }),
        "appointment",
      );
      expect(response.status).toBe(500);
      expect(await response.text()).not.toMatch(/SENSITIVE_SENTINEL|insert into|fictional/);
      expect(await counts()).toEqual(before);
      expect(JSON.stringify(logger.mock.calls)).not.toContain("SENSITIVE_SENTINEL");
    } finally {
      await admin.client.unsafe(
        "DROP TRIGGER qa_fail_submission ON healthcare.audit_events; DROP FUNCTION healthcare.qa_fail_submission();",
      );
      logger.mockRestore();
    }
    expect(
      (await handle(request("appointment", body, { "idempotency-key": key }), "appointment"))
        .status,
    ).toBe(201);
  });
  it("rejects invalid records and anti-spam failures without inserting records", async () => {
    const before = await counts();
    for (const body of [
      { ...appointment(), consent: false },
      { ...appointment(), name: "" },
      { ...appointment(), phone: "bad" },
      { ...appointment(), time: "Any arbitrary time" },
      { ...appointment(), role: "owner" },
      { ...appointment(), turnstileToken: "" },
      { ...appointment(), website: "bot-filled" },
      { ...appointment(), service: "mobility-assessment" },
      { ...appointment(), date: "2001-01-01" },
      { ...appointment(), date: "2099-01-01" },
    ]) {
      expect((await handle(request("appointment", body), "appointment")).status).toBe(422);
    }
    expect(await counts()).toEqual(before);
    const failed = await handle(request("inquiry", inquiry()), "inquiry", async () => {
      throw { code: "ECONNREFUSED" };
    });
    expect(failed.status).toBe(503);
    expect(await counts()).toEqual(before);
  });
  it("enforces origin, format, body limits, consent and idempotency headers before a write", async () => {
    const cases: { header: Record<string, string>; status: number }[] = [
      { header: { origin: "https://attacker.example" }, status: 403 },
      { header: { "sec-fetch-site": "cross-site" }, status: 403 },
      { header: { "content-type": "text/plain" }, status: 415 },
      { header: { "content-length": "20000" }, status: 413 },
      { header: { "idempotency-key": "not-a-uuid" }, status: 422 },
    ];
    const before = await counts();
    for (const testCase of cases)
      expect((await handle(request("inquiry", inquiry(), testCase.header), "inquiry")).status).toBe(
        testCase.status,
      );
    expect((await handle(request("inquiry", {}, {}, "{"), "inquiry")).status).toBe(400);
    expect(
      (
        await handle(
          request("inquiry", {}, {}, JSON.stringify({ message: "x".repeat(17000) })),
          "inquiry",
        )
      ).status,
    ).toBe(413);
    expect(await counts()).toEqual(before);
  });
  it("rejects a service disabled in the database after the form was loaded", async () => {
    const before = await counts();
    await admin.client`update healthcare.services set enabled=false where slug='physiotherapy'`;
    try {
      expect((await handle(request("appointment", appointment()), "appointment")).status).toBe(422);
      expect(await counts()).toEqual(before);
    } finally {
      await admin.client`update healthcare.services set enabled=true where slug='physiotherapy'`;
    }
  });
  it("fails closed when the database connection is unavailable", async () => {
    const url = new URL(process.env.TEST_SUBMISSION_DATABASE_URL!);
    url.port = "1";
    url.password = "SENSITIVE_SENTINEL";
    const down = openDatabase(url.toString());
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await handleSubmission(request("inquiry", inquiry()), "inquiry", {
        db: down.db,
        policy,
        verify: accepted,
      });
      expect(response.status).toBe(503);
      expect(await response.text()).not.toMatch(/SENSITIVE_SENTINEL|postgres|select/);
    } finally {
      await down.close();
      logger.mockRestore();
    }
  });
  it("fails closed if another deployment identity is selected", async () => {
    await app.client`update healthcare.business_settings set profile_id='other' where id=1`;
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect((await handle(request("inquiry", inquiry()), "inquiry")).status).toBe(503);
    } finally {
      await app.client`update healthcare.business_settings set profile_id='default' where id=1`;
      logger.mockRestore();
    }
  });
  it("rate limits concurrent attempts durably, stores hashes only and counts verification failures", async () => {
    const bucket = `concurrent-${randomUUID()}`;
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, () => takeRateLimit(app.db, policy.hmacSecret, bucket, 3, 60000)),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(9);
    const ip = "192.0.2.239";
    for (let i = 0; i < 6; i++)
      expect(
        (
          await handle(request("inquiry", inquiry(), { "x-real-ip": ip }), "inquiry", async () => {
            throw { code: "23514" };
          })
        ).status,
      ).toBe(422);
    const denied = await handle(
      request("inquiry", inquiry(), { "x-real-ip": ip, "x-forwarded-for": "198.51.100.2" }),
      "inquiry",
    );
    expect(denied.status).toBe(429);
    expect(Number(denied.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(Number(denied.headers.get("retry-after"))).toBeLessThanOrEqual(900);
    const keys = await app.client`select key_hash from healthcare.submission_limits`;
    expect(keys.every((r) => /^[a-f0-9]{64}$/.test(r.key_hash))).toBe(true);
    expect(JSON.stringify(keys)).not.toContain(ip);
    const reconnected = openDatabase(process.env.TEST_SUBMISSION_DATABASE_URL);
    try {
      expect(
        (
          await handleSubmission(request("inquiry", inquiry(), { "x-real-ip": ip }), "inquiry", {
            db: reconnected.db,
            policy,
            verify: accepted,
          })
        ).status,
      ).toBe(429);
    } finally {
      await reconnected.close();
    }
  });
  it("does not trust unconfigured forwarding headers", async () => {
    const sharedPolicy = { ...policy, ipHeader: "none" as const, hmacSecret: "g".repeat(64) };
    for (let i = 0; i < 6; i++)
      await handleSubmission(
        request("inquiry", inquiry(), {
          "x-real-ip": `192.0.2.${i}`,
          "x-forwarded-for": `198.51.100.${i}`,
        }),
        "inquiry",
        {
          db: app.db,
          policy: sharedPolicy,
          verify: async () => {
            throw { code: "23514" };
          },
        },
      );
    expect(
      (
        await handleSubmission(
          request("inquiry", inquiry(), { "x-forwarded-for": "203.0.113.99" }),
          "inquiry",
          { db: app.db, policy: sharedPolicy, verify: accepted },
        )
      ).status,
    ).toBe(429);
  });
  it("keeps public retry metadata private and immutable to ordinary update operations", async () => {
    for (const table of ["submission_limits", "submission_receipts"]) {
      const [row] =
        await admin.client`select rowsecurity from pg_tables where schemaname='healthcare' and tablename=${table}`;
      expect(row.rowsecurity).toBe(true);
      expect(
        (
          await admin.client`select has_table_privilege('anon', ${"healthcare." + table}, 'SELECT') as access`
        )[0].access,
      ).toBe(false);
    }
    await expect(
      app.client`update healthcare.submission_receipts set fingerprint = ${"x".repeat(64)}`,
    ).rejects.toMatchObject({ code: "42501" });
    expect(digest(policy.hmacSecret, "private@example.com")).not.toContain("private");
  });
});

describe("anti-spam and deployment policy", () => {
  it("allows explicit local dummy credentials and rejects production or nonlocal use", () => {
    expect(policy.mode).toBe("local-test");
    for (const env of [
      { ...baseEnv, VERCEL_ENV: "production" },
      { ...baseEnv, SUBMISSIONS_MODE: "live" },
      { ...baseEnv, SUBMISSION_ALLOWED_ORIGINS: "https://public.example" },
      { ...baseEnv, SUBMISSIONS_HMAC_SECRET: "short" },
      { ...baseEnv, TRUSTED_CLIENT_IP_HEADER: "x-forwarded-for" },
    ])
      expect(() => submissionPolicy(env)).toThrow();
    expect(submissionPolicy({}).mode).toBe("disabled");
  });
  it("checks token, provider failures, action and hostname on the server", async () => {
    const live = { ...policy, mode: "live" as const, origins: ["https://care.example"] };
    const response = (value: unknown) => vi.fn(async () => Response.json(value)) as typeof fetch;
    await verifyTurnstile(
      "live-token",
      "appointment",
      "https://care.example",
      live,
      response({ success: true, hostname: "care.example", action: "appointment" }),
    );
    for (const body of [
      { success: false, "error-codes": ["timeout-or-duplicate"] },
      { success: true, hostname: "wrong.example", action: "appointment" },
      { success: true, hostname: "care.example", action: "inquiry" },
    ])
      await expect(
        verifyTurnstile("live-token", "appointment", "https://care.example", live, response(body)),
      ).rejects.toMatchObject({ code: "VERIFICATION_FAILED" });
    await expect(
      verifyTurnstile(
        "not-dummy",
        "appointment",
        policy.origins[0],
        policy,
        response({ success: true }),
      ),
    ).rejects.toMatchObject({ code: "VERIFICATION_FAILED" });
    await expect(
      verifyTurnstile(
        "live-token",
        "appointment",
        "https://care.example",
        live,
        vi.fn(async () => {
          throw new Error("SENSITIVE_SENTINEL");
        }) as typeof fetch,
      ),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
  it("validates business-timezone dates independently of the browser timezone", () => {
    const now = new Date("2026-11-02T20:00:00Z"); // 3 November in Karachi.
    expect(() =>
      validatePreferredDate("2026-11-02", "No preference", "Asia/Karachi", now),
    ).toThrow();
    expect(() =>
      validatePreferredDate("2026-11-03", "Morning (9am–12pm)", "Asia/Karachi", now),
    ).not.toThrow();
    expect(() =>
      validatePreferredDate(
        "2026-11-03",
        "Morning (9am–12pm)",
        "Asia/Karachi",
        new Date("2026-11-03T12:00:00Z"),
      ),
    ).toThrow();
  });
  it("calls Cloudflare Siteverify with the official passing and failing test secrets", async () => {
    await verifyTurnstile("XXXX.DUMMY.TOKEN.XXXX", "appointment", policy.origins[0], policy);
    await expect(
      verifyTurnstile("XXXX.DUMMY.TOKEN.XXXX", "appointment", policy.origins[0], {
        ...policy,
        secretKey: "2x0000000000000000000000000000000AA",
      }),
    ).rejects.toMatchObject({ code: "VERIFICATION_FAILED" });
  });
});
