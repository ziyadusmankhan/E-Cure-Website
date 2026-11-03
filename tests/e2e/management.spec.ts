import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import postgres from "postgres";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { totp } from "../../qa/totp";
const url = process.env.QA_SUBMISSION_ADMIN;
if (!url || !new URL(url).pathname.startsWith("/healthcare_browser_test_"))
  throw new Error("Use the isolated management harness.");
const admin = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
const headers = { origin: "http://127.0.0.1:3104" };
async function login(page: Page, role = "OWNER", next = "") {
  await page.goto(next || "/admin/login");
  await page.getByLabel("Staff email", { exact: true }).fill(process.env[`QA_AUTH_${role}_EMAIL`]!);
  await page.getByLabel("Password", { exact: true }).fill(process.env[`QA_AUTH_${role}_PASSWORD`]!);
  await page.getByRole("button", { name: "Sign in securely", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/mfa\?/);
  await page
    .getByLabel("Six-digit security code")
    .fill(totp(process.env[`QA_AUTH_${role}_SECRET`]!));
  await page.getByRole("button", { name: "Verify and continue", exact: true }).click();
  await expect(page).toHaveURL(`http://127.0.0.1:3104${next || "/admin"}`);
}
async function api(page: Page, path: string, body: unknown) {
  return page.request.post(`/api/admin/${path}`, { data: body, headers });
}
test.afterAll(async () => {
  await admin.end({ timeout: 5 });
});
test("inquiries support assigned follow-up, history, search and mobile navigation", async ({
  page,
  browser,
}, info) => {
  const response = await page.request.post("/api/inquiries", {
    headers: { ...headers, "idempotency-key": randomUUID() },
    data: {
      name: "Fictional Inquiry Workflow",
      email: "inquiry-workflow@example.com",
      topic: "care-options",
      message: "Please explain the fictional scheduling arrangements.",
      consent: true,
      website: "",
      turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
    },
  });
  expect(response.status()).toBe(201);
  const receipt = await response.json();
  await login(page);
  await page.goto("/admin/inquiries");
  await page.getByLabel("Search", { exact: true }).fill("inquiry-workflow");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("link", { name: receipt.reference, exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/inquiries\/[a-f0-9-]+$/);
  const path = new URL(page.url()).pathname;
  const ctx = await browser.newContext();
  const staff = await ctx.newPage();
  await login(staff, "RECEPTIONIST");
  expect((await staff.request.get(path.replace("/admin/", "/api/admin/"))).status()).toBe(404);
  await page.getByLabel("Assigned staff").selectOption(process.env.QA_AUTH_RECEPTIONIST_ID!);
  await page.getByRole("button", { name: "Save assignment", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
  await staff.goto(path);
  await staff.getByLabel("New status", { exact: true }).selectOption("read");
  await staff.getByRole("button", { name: "Update status", exact: true }).click();
  await expect(staff.locator(".status-chip")).toHaveText("read");
  await staff
    .getByLabel("Administrative note", { exact: true })
    .fill("Return call tomorrow morning.");
  await staff.getByRole("button", { name: "Add note", exact: true }).click();
  await expect(staff.getByText("Return call tomorrow morning.", { exact: true })).toBeVisible();
  await staff.setViewportSize({ width: 320, height: 900 });
  expect(await staff.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await staff.getByText("Workspace navigation", { exact: true }).click();
  await expect(staff.getByRole("link", { name: "Customers", exact: true })).toBeHidden();
  await staff.getByText("Workspace navigation", { exact: true }).click();
  await expect(staff.getByRole("link", { name: "Customers", exact: true })).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page: staff })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await staff.screenshot({ path: info.outputPath("mobile-inquiry.png"), fullPage: true });
  await ctx.close();
});
test("public booking appears in dashboard; Owner assigns and staff manage status, notes and customer", async ({
  page,
  browser,
}, info) => {
  const booking = await page.request.post("/api/appointments", {
    headers: { ...headers, "idempotency-key": randomUUID() },
    data: {
      service: "physiotherapy",
      name: "Fictional Management Person",
      phone: "+12025550191",
      email: "management@example.com",
      date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
      time: "No preference",
      visitMode: "home",
      inquiry: "Fictional scheduling question.",
      consent: true,
      website: "",
      turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
    },
  });
  expect(booking.status()).toBe(201);
  const receipt = await booking.json();
  await login(page);
  await expect(page.getByRole("link", { name: receipt.reference, exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Appointments", exact: true }).click();
  await page.getByLabel("Search", { exact: true }).fill("Management");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("link", { name: receipt.reference, exact: true }).click();
  await expect(page.getByRole("heading", { name: "Fictional Management Person" })).toBeVisible();
  await page.getByLabel("Assigned staff").selectOption(process.env.QA_AUTH_RECEPTIONIST_ID!);
  await page.getByRole("button", { name: "Save assignment", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
  const path = new URL(page.url()).pathname;
  const staffContext = await browser.newContext();
  const staffPage = await staffContext.newPage();
  await login(staffPage, "RECEPTIONIST");
  await staffPage.goto(path);
  await staffPage.getByLabel("New status", { exact: true }).selectOption("contacted");
  await staffPage.getByRole("button", { name: "Update status", exact: true }).click();
  await expect(staffPage.getByRole("status")).toHaveText("Saved.");
  await expect(staffPage.locator(".status-chip")).toHaveText("contacted");
  await staffPage
    .getByLabel("Administrative note", { exact: true })
    .fill("Call tomorrow to arrange a suitable time.");
  await staffPage.getByRole("button", { name: "Add note", exact: true }).click();
  await expect(
    staffPage.getByText("Call tomorrow to arrange a suitable time.", { exact: true }),
  ).toBeVisible();
  await staffPage.getByRole("link", { name: "View customer", exact: true }).click();
  await staffPage.getByLabel("Name", { exact: true }).fill("Updated Fictional Management Person");
  await staffPage.getByRole("button", { name: "Save customer", exact: true }).click();
  await expect(staffPage.getByRole("status")).toHaveText("Customer saved.");
  await expect(staffPage.getByRole("heading", { level: 1 })).toHaveText(
    "Updated Fictional Management Person",
  );
  for (const width of [320, 390, 768, 1440]) {
    await staffPage.setViewportSize({ width, height: 900 });
    expect(await staffPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  expect(
    (
      await new AxeBuilder({ page: staffPage })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await staffPage.screenshot({ path: info.outputPath("mobile-customer.png"), fullPage: true });
  await staffContext.close();
});
test("Owner edits branding, uploads a logo, previews a private draft, publishes and updates public navigation", async ({
  page,
  browser,
}, info) => {
  await login(page, "OWNER", "/admin/website");
  await page.getByRole("link", { name: "Website editor", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Fictional Care Published");
  await page.getByLabel("Short Name", { exact: true }).fill("Fictional Care Published");
  await page.getByLabel("Phone", { exact: true }).fill("+12025550155");
  await page.getByLabel("Email", { exact: true }).fill("fictional-care@example.com");
  await page.getByLabel("Theme", { exact: true }).selectOption("soft-teal");
  const png = await sharp({
    create: { width: 200, height: 120, channels: 3, background: "#254c55" },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("Logo", { exact: true })
    .setInputFiles({ name: "fictional-logo.png", mimeType: "image/png", buffer: png });
  await expect(page.getByAltText("Logo preview")).toHaveAttribute("src", /\/api\/admin\/media\//);
  await page.getByRole("button", { name: "Save branding draft", exact: true }).click();
  await expect(page.locator(".admin-publication").getByRole("status")).toContainText(
    "Draft saved.",
  );
  const anon = await browser.newContext();
  const publicPage = await anon.newPage();
  await publicPage.goto("/");
  await expect(publicPage.locator(".site-header")).not.toContainText("Fictional Care Published");
  await anon.addCookies([
    {
      name: "healthcare-cms-preview",
      value: "1",
      url: "http://127.0.0.1:3104",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  await publicPage.reload();
  await expect(publicPage.locator(".cms-preview-banner")).toHaveCount(0);
  await expect(publicPage.locator(".site-header")).not.toContainText("Fictional Care Published");
  const state = await (await page.request.get("/api/admin/cms")).json();
  const path = state.draft.brand.logo.src;
  expect((await publicPage.request.get(path)).status()).toBe(404);
  await page.getByRole("button", { name: "Preview saved draft", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3104/");
  await expect(page.locator(".cms-preview-banner")).toBeVisible();
  await expect(page.locator(".site-header")).toContainText("Fictional Care Published");
  await expect(page.getByAltText(state.draft.brand.logo.alt).first()).toBeVisible();
  await page.getByRole("link", { name: "Return to editor", exact: true }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Publish website", exact: true }).click();
  await expect(page.locator(".admin-publication").getByRole("status")).toContainText("Published.");
  await publicPage.reload();
  await expect(publicPage.locator(".site-header")).toContainText("Fictional Care Published");
  await expect(publicPage.locator("html")).toHaveAttribute("data-theme", "soft-teal");
  expect((await publicPage.request.get(path)).status()).toBe(200);
  const [settings] =
    await admin`select phone,contact_email from healthcare.business_settings where id=1`;
  expect(settings).toMatchObject({
    phone: "+12025550155",
    contact_email: "fictional-care@example.com",
  });
  await page.getByRole("button", { name: "Content", exact: true }).click();
  const copyState = await (await page.request.get("/api/admin/cms")).json();
  const key = Object.keys(copyState.draft.copy).find(
    (k) => k.startsWith("home_") && copyState.draft.copy[k].length > 40,
  )!;
  const fieldLabel = key
    .replace(/^home_/, "")
    .replace(/_\d+$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  await page
    .getByLabel(fieldLabel, { exact: true })
    .fill("Fictional home content updated from the Owner website editor.");
  await page.getByRole("button", { name: "Save content draft", exact: true }).click();
  await expect(page.locator(".admin-publication").getByRole("status")).toContainText(
    "Draft saved.",
  );
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Publish website", exact: true }).click();
  await expect(page.locator(".admin-publication").getByRole("status")).toContainText("Published.");
  await publicPage.reload();
  await expect(
    publicPage.getByText("Fictional home content updated from the Owner website editor.", {
      exact: true,
    }),
  ).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: info.outputPath("content-editor.png"), fullPage: true });
  await anon.close();
});
test("Owner creates a service in the editor, reorders it, publishes and disables it without losing booking history", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.goto("/admin/website");
  await page
    .getByRole("navigation", { name: "Website editor sections" })
    .getByRole("button", { name: "Services", exact: true })
    .click();
  await page.getByRole("button", { name: "Add service", exact: true }).click();
  for (const [field, value] of Object.entries({
    "Page address (lowercase words separated by hyphens)": "fictional-new-care",
    Title: "Fictional New Care",
    "Short Title": "New care",
    Label: "Coordinated fictional care",
    Description: "A fictional new service for browser verification.",
    Headline: "A new service, managed by the Owner.",
    Overview: "This fictional service demonstrates content management without editing code.",
  }))
    await page.getByLabel(field, { exact: true }).fill(value);
  await page.getByLabel("Enabled after publishing", { exact: true }).check();
  await page.getByRole("button", { name: "Save service draft", exact: true }).click();
  await expect(page.locator(".admin-publication").getByRole("status")).toContainText(
    "Draft saved.",
  );
  const state = await (await page.request.get("/api/admin/cms")).json();
  const anon = await browser.newContext();
  expect((await anon.request.get("/services/fictional-new-care")).status()).toBe(404);
  await expect(page.locator(".admin-service-list > li").last()).toContainText("Fictional New Care");
  for (let index = state.draft.services.length - 1; index > 0; index--) {
    const response = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/api/admin/cms/reorder" && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Move up New care", exact: true }).click();
    expect((await response).status()).toBe(200);
  }
  await expect(page.locator(".admin-service-list > li").first()).toContainText(
    "Fictional New Care",
  );
  await page.reload();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Publish website", exact: true }).click();
  await expect(page.locator(".admin-publication").getByRole("status")).toContainText("Published.");
  const pub = await anon.newPage();
  await pub.goto("/services/fictional-new-care");
  await expect(pub.getByRole("heading", { level: 1 })).toContainText(
    "A new service, managed by the Owner.",
  );
  await pub.goto("/book-appointment?service=fictional-new-care");
  await expect(pub.locator("body")).toContainText("Fictional New Care");
  await page
    .getByRole("navigation", { name: "Website editor sections" })
    .getByRole("button", { name: "Services", exact: true })
    .click();
  await page.getByRole("button", { name: "Disable New care", exact: true }).click();
  await expect(page.locator(".admin-publication").getByRole("status")).toContainText(
    "Draft saved.",
  );
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Publish website", exact: true }).click();
  await expect(page.locator(".admin-publication").getByRole("status")).toContainText("Published.");
  expect((await anon.request.get("/services/fictional-new-care")).status()).toBe(404);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Remove New care", exact: true }).click();
  await expect(page.locator(".admin-publication").getByRole("status")).toContainText(
    "Draft saved.",
  );
  let empty = await (await page.request.get("/api/admin/cms")).json();
  for (const item of [...empty.draft.services]) {
    const res = await api(page, "cms/remove", { revision: empty.revision, slug: item.slug });
    expect(res.status()).toBe(200);
    empty = await res.json();
  }
  expect((await api(page, "cms/publish", { revision: empty.revision })).status()).toBe(422);
  await page.reload();
  await page
    .getByRole("navigation", { name: "Website editor sections" })
    .getByRole("button", { name: "Services", exact: true })
    .click();
  await page.getByRole("button", { name: "Add service", exact: true }).click();
  await expect(page.getByLabel("Title", { exact: true })).toBeVisible();
  expect((await api(page, "cms/discard", { revision: empty.revision })).status()).toBe(200);
  await anon.close();
});
test("direct APIs reject anonymous access, Owner-only operations, CSRF and stale updates; exports are private", async ({
  page,
  browser,
}) => {
  expect((await page.request.get("/api/admin/appointments")).status()).toBe(401);
  const redirect = await page.request.get("/admin/website", {
    maxRedirects: 0,
    headers: { "x-healthcare-admin-path": "https://evil.example" },
  });
  expect(redirect.status()).toBe(307);
  expect(
    new URL(redirect.headers().location, "http://127.0.0.1:3104").searchParams.get("next"),
  ).toBe("/admin/website");
  await login(page, "RECEPTIONIST");
  expect((await page.request.get("/api/admin/cms")).status()).toBe(403);
  expect((await page.request.get("/api/admin/appointments/export")).status()).toBe(403);
  await page.goto("/admin/website");
  await expect(page).toHaveURL(/\/admin\?denied=1/);
  expect((await api(page, "cms/publish", { revision: 0 })).status()).toBe(403);
  const ctx = await browser.newContext();
  const owner = await ctx.newPage();
  await login(owner);
  let state = await (await owner.request.get("/api/admin/cms")).json();
  expect(
    (
      await owner.request.post("/api/admin/cms/publish", {
        data: { revision: state.revision },
        headers: { origin: "https://evil.example" },
      })
    ).status(),
  ).toBe(403);
  const changed = await api(owner, "cms/brand", {
    revision: state.revision,
    brand: state.draft.brand,
  });
  expect(changed.status()).toBe(200);
  expect(
    (
      await api(owner, "cms/brand", { revision: state.revision, brand: state.draft.brand })
    ).status(),
  ).toBe(409);
  const csv = await owner.request.get("/api/admin/appointments/export");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["cache-control"]).toContain("no-store");
  expect(await csv.text()).toContain("'+12025550191");
  state = await (await owner.request.get("/api/admin/cms")).json();
  expect((await api(owner, "cms/discard", { revision: state.revision })).status()).toBe(200);
  await ctx.close();
});
