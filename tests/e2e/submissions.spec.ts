import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import postgres from "postgres";
import { randomUUID } from "node:crypto";

const dbUrl = process.env.QA_SUBMISSION_DB;
if (!dbUrl || !new URL(dbUrl).pathname.startsWith("/healthcare_browser_test_"))
  throw new Error("A disposable browser test database is required.");
const db = postgres(dbUrl, { max: 1, prepare: false, onnotice: () => {} });
const admin = postgres(process.env.QA_SUBMISSION_ADMIN!, {
  max: 1,
  prepare: false,
  onnotice: () => {},
});
const tomorrow = () => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
let phoneSequence = 140;
const payload = (email: string) => ({
  service: "physiotherapy",
  name: "Fictional Browser Person",
  phone: `+1202555${String(phoneSequence++).padStart(4, "0")}`,
  email,
  date: tomorrow(),
  time: "No preference",
  visitMode: "home",
  inquiry: "Fictional arrangement inquiry.",
  consent: true,
  website: "",
  turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
});
const requestHeaders = (key: string, ip = "192.0.2.50") => ({
  origin: "http://127.0.0.1:3102",
  "idempotency-key": key,
  "x-real-ip": ip,
});
// Some test networks replay challenge responses with a clock ahead of the host.
// This explicit QA-only option aligns the browser clock; application clocks and
// verification responses remain untouched. Never use it to mask real-key failures.
let challengeClock: Date | undefined;
test.beforeAll(async () => {
  if (process.env.QA_TURNSTILE_CLOCK_FROM_HTTP !== "1") return;
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    { signal: AbortSignal.timeout(15000), cache: "no-store" },
  );
  const date = response.headers.get("date");
  if (!response.ok || !date || !Number.isFinite(Date.parse(date)))
    throw new Error("Cannot read the external challenge clock for this QA run.");
  challengeClock = new Date(date);
  console.log(`QA browser clock aligned to challenge HTTP Date: ${challengeClock.toISOString()}`);
});
test.beforeEach(async ({ page }, info) => {
  if (!challengeClock) return;
  await page.clock.setSystemTime(challengeClock);
  await info.attach("external-challenge-clock", {
    body: JSON.stringify({ host: new Date().toISOString(), browser: challengeClock.toISOString() }),
    contentType: "application/json",
  });
});
async function fillBooking(page: Page, email: string) {
  await page.goto("/book-appointment?service=physiotherapy");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Patient or contact name").fill("Fictional Browser Person");
  await page.getByLabel("Contact number", { exact: true }).fill("+1 202 555 0129");
  await page.getByLabel("Email (optional)", { exact: false }).fill(email);
  await page.getByLabel("Preferred date", { exact: true }).fill(tomorrow());
  await page.getByLabel("Preferred time window").selectOption("No preference");
  await page.getByLabel("Preferred format").selectOption("home");
  await page.getByRole("button", { name: "Review request", exact: true }).click();
  await page.getByRole("checkbox").check();
  await expect(
    page.getByRole("button", { name: "Send appointment request", exact: true }),
  ).toBeEnabled({ timeout: 30000 });
}
async function fillInquiry(page: Page, email: string) {
  await page.goto("/contact");
  await page.getByLabel("Your name", { exact: true }).fill("Fictional Browser Person");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Topic", { exact: true }).selectOption("Exploring care options");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("Fictional inquiry about arrangements only.");
  await page.getByRole("checkbox").check();
  await expect(page.getByRole("button", { name: "Send inquiry", exact: true })).toBeEnabled({
    timeout: 30000,
  });
}
test.afterAll(async () => {
  await Promise.all([db.end({ timeout: 5 }), admin.end({ timeout: 5 })]);
});

test("mobile appointment saves once and returns an unconfirmed reference", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fillBooking(page, "mobile-appointment@example.com");
  const submissions: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/api/appointments") && r.method() === "POST") submissions.push(r.url());
  });
  await page.getByRole("button", { name: "Send appointment request", exact: true }).dblclick();
  await expect(
    page.getByRole("heading", { name: "Your request has been received." }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("does not confirm an appointment");
  const reference = (await page.locator(".submission-reference strong").textContent())!;
  const rows =
    await db`select a.status,a.confirmed_at,c.consent_at,c.email from healthcare.appointments a join healthcare.customers c on c.id=a.customer_id where a.reference=${reference}`;
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe("new");
  expect(rows[0].confirmed_at).toBeNull();
  expect(rows[0].consent_at).not.toBeNull();
  expect(submissions).toHaveLength(1);
  await page.screenshot({
    path: info.outputPath("appointment-mobile-receipt.png"),
    fullPage: true,
  });
});
test("320px contact submission persists and resets with no personal details left in the form", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await fillInquiry(page, "mobile-inquiry@example.com");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: info.outputPath("contact-mobile-before-submit.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your inquiry has been received." }),
  ).toBeVisible();
  const reference = (await page.locator(".submission-reference strong").textContent())!;
  const [row] =
    await db`select status,consent_at from healthcare.contact_inquiries where reference=${reference}`;
  expect(row.status).toBe("new");
  expect(row.consent_at).not.toBeNull();
  await page.getByRole("button", { name: "Try another inquiry" }).click();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("");
});
test("HTTP retries return the same reference and cannot change a committed payload", async ({
  request,
}) => {
  const key = randomUUID();
  const body = payload("retry-api@example.com");
  const first = await request.post("/api/appointments", {
    data: body,
    headers: requestHeaders(key, "192.0.2.52"),
  });
  expect(first.status()).toBe(201);
  const second = await request.post("/api/appointments", {
    data: body,
    headers: requestHeaders(key, "192.0.2.52"),
  });
  expect(second.status()).toBe(200);
  const receipt = await first.json();
  expect((await second.json()).reference).toBe(receipt.reference);
  expect(
    (await db`select id from healthcare.appointments where reference=${receipt.reference}`).length,
  ).toBe(1);
  expect(
    (
      await request.post("/api/appointments", {
        data: { ...body, name: "Changed Example" },
        headers: requestHeaders(key, "192.0.2.52"),
      })
    ).status(),
  ).toBe(409);
});
test("API rejects invalid, disabled, cross-origin, oversized and unverified submissions", async ({
  request,
}) => {
  const badBodies = [
    { ...payload("invalid@example.com"), consent: false },
    { ...payload("invalid@example.com"), service: "mobility-assessment" },
    { ...payload("invalid@example.com"), date: "2001-01-01" },
    { ...payload("invalid@example.com"), turnstileToken: "not-a-token" },
  ];
  for (const [index, data] of badBodies.entries())
    expect(
      (
        await request.post("/api/appointments", {
          data,
          headers: requestHeaders(randomUUID(), `192.0.2.${70 + index}`),
        })
      ).status(),
    ).toBe(422);
  expect(
    (
      await request.post("/api/appointments", {
        data: payload("cross-origin@example.com"),
        headers: { ...requestHeaders(randomUUID()), origin: "https://attacker.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/inquiries", {
        data: { message: "x".repeat(17000) },
        headers: requestHeaders(randomUUID()),
      })
    ).status(),
  ).toBe(413);
  expect((await request.get("/api/appointments")).status()).toBe(405);
  expect((await request.get("/admin")).status()).toBe(404);
  expect(
    await db`select c.id from healthcare.customers c where email='invalid@example.com'`,
  ).toHaveLength(0);
});
test("a persistence failure preserves form details and a fresh verification can retry safely", async ({
  page,
}) => {
  await fillInquiry(page, "failure-retry@example.com");
  await admin.unsafe(
    "CREATE FUNCTION healthcare.qa_browser_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SENSITIVE_BROWSER_SENTINEL'; END $$; CREATE TRIGGER qa_browser_failure BEFORE INSERT ON healthcare.contact_inquiries FOR EACH ROW EXECUTE FUNCTION healthcare.qa_browser_failure();",
  );
  try {
    const response = page.waitForResponse(
      (r) => r.url().endsWith("/api/inquiries") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
    const failed = await response;
    expect(failed.status()).toBe(500);
    expect(await failed.text()).not.toContain("SENSITIVE_BROWSER_SENTINEL");
    await expect(
      page.getByRole("alert").filter({ hasText: "temporarily unavailable" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
      "failure-retry@example.com",
    );
    expect(
      await db`select id from healthcare.contact_inquiries where email='failure-retry@example.com'`,
    ).toHaveLength(0);
  } finally {
    await admin.unsafe(
      "DROP TRIGGER qa_browser_failure ON healthcare.contact_inquiries; DROP FUNCTION healthcare.qa_browser_failure();",
    );
  }
  await expect(page.getByRole("button", { name: "Send inquiry", exact: true })).toBeEnabled({
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your inquiry has been received." }),
  ).toBeVisible();
  expect(
    await db`select id from healthcare.contact_inquiries where email='failure-retry@example.com'`,
  ).toHaveLength(1);
});
test("losing a response after commit can be retried without a duplicate", async ({ page }) => {
  await fillBooking(page, "lost-response@example.com");
  await page.route("**/api/appointments", async (route) => {
    await route.fetch();
    await route.abort("failed");
  });
  await page.getByRole("button", { name: "Send appointment request", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "could not confirm" })).toBeVisible();
  await page.unroute("**/api/appointments");
  await expect(
    page.getByRole("button", { name: "Send appointment request", exact: true }),
  ).toBeEnabled({ timeout: 30000 });
  await page.getByRole("button", { name: "Send appointment request", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your request has been received." }),
  ).toBeVisible();
  expect(
    await db`select a.id from healthcare.appointments a join healthcare.customers c on c.id=a.customer_id where c.email='lost-response@example.com'`,
  ).toHaveLength(1);
});
test("active forms and privacy notice remain responsive and accessible", async ({ page }, info) => {
  for (const path of ["/contact", "/book-appointment", "/privacy-policy"]) {
    await page.goto(path);
    for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} ${width}`,
      ).toBe(true);
    }
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations, JSON.stringify(result.violations)).toEqual([]);
      await page.screenshot({
        path: info.outputPath(`${path.slice(1)}-${width}.png`),
        fullPage: true,
      });
    }
  }
});
test("security script failures block sending and can recover without losing details", async ({
  page,
}) => {
  await page.route("https://challenges.cloudflare.com/**", (route) => route.abort("failed"));
  await page.goto("/contact");
  await page.getByLabel("Your name", { exact: true }).fill("Fictional Browser Person");
  await page.getByLabel("Email address", { exact: true }).fill("security-retry@example.com");
  await page.getByLabel("Topic", { exact: true }).selectOption("Exploring care options");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("Fictional security verification retry.");
  await page.getByRole("checkbox").check();
  await expect(page.getByRole("status")).toContainText("unavailable", { timeout: 30000 });
  await expect(page.getByRole("button", { name: "Send inquiry", exact: true })).toBeDisabled();
  await page.unroute("https://challenges.cloudflare.com/**");
  await page.getByRole("button", { name: "Retry verification" }).click();
  await expect(page.getByRole("button", { name: "Send inquiry", exact: true })).toBeEnabled({
    timeout: 30000,
  });
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "security-retry@example.com",
  );
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your inquiry has been received." }),
  ).toBeVisible();
});
test("rate limits are enforced by the running API even with spoofed forwarding headers", async ({
  request,
}) => {
  const responses = [];
  for (let index = 0; index < 8; index++)
    responses.push(
      await request.post("/api/inquiries", {
        data: {
          name: "Fictional Rate Test",
          email: `rate${index}@example.com`,
          topic: "other",
          message: "Fictional test for durable request limits.",
          consent: true,
          website: "",
          turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
        },
        headers: {
          ...requestHeaders(randomUUID(), "192.0.2.199"),
          "x-forwarded-for": `203.0.113.${index}`,
        },
      }),
    );
  expect(responses.map((r) => r.status())).toEqual([201, 201, 201, 201, 201, 201, 429, 429]);
  expect(Number(responses[7].headers()["retry-after"])).toBeGreaterThan(0);
  expect(Number(responses[7].headers()["retry-after"])).toBeLessThanOrEqual(900);
  expect(
    await db`select id from healthcare.contact_inquiries where email like 'rate%@example.com'`,
  ).toHaveLength(6);
});
