import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import postgres from "postgres";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { totp } from "../../qa/totp";
const url = process.env.QA_SUBMISSION_ADMIN;
if (!url || !new URL(url).pathname.startsWith("/healthcare_browser_test_"))
  throw new Error("An isolated Auth browser database is required.");
const admin = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
const credentials = (label: string) => ({
  email: process.env[`QA_AUTH_${label}_EMAIL`]!,
  password: process.env[`QA_AUTH_${label}_PASSWORD`]!,
});
const headers = { origin: "http://127.0.0.1:3103" };
async function firstFactor(page: Page, label: string) {
  await page.goto("/admin/login");
  const values = credentials(label);
  await page.getByLabel("Staff email", { exact: true }).fill(values.email);
  await page.getByLabel("Password", { exact: true }).fill(values.password);
  await page.getByRole("button", { name: "Sign in securely", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/mfa\?/);
}
async function login(page: Page, label = "OWNER") {
  await firstFactor(page, label);
  await page
    .getByLabel("Six-digit security code")
    .fill(totp(process.env[`QA_AUTH_${label}_SECRET`]!));
  await page.getByRole("button", { name: "Verify and continue", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
test.afterAll(async () => {
  await admin.end({ timeout: 5 });
});

test("anonymous and forged sessions cannot access staff pages or APIs", async ({
  page,
  request,
}) => {
  await page.goto("/admin/access");
  await expect(page).toHaveURL(/\/admin\/login\?/);
  expect((await request.get("/api/admin/session")).status()).toBe(401);
  expect(
    (
      await request.get("/api/admin/permissions", {
        headers: {
          cookie: `healthcare-admin=${randomBytes(32).toString("hex")}`,
          "x-role": "owner",
        },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/auth/logout", {
        data: {},
        headers: { origin: "https://evil.example" },
      })
    ).status(),
  ).toBe(403);
});
test("real Owner login requires valid MFA before protected pages and direct API access", async ({
  page,
}, info) => {
  await firstFactor(page, "OWNER");
  expect(await page.locator(".admin-auth-brand").evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(255, 255, 255)");
  expect(await page.locator("h1").evaluate(el => getComputedStyle(el).color)).toBe("rgb(11, 50, 95)");
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("staff-verification-1440.png"), fullPage: true });
  expect((await page.request.get("/api/admin/session")).status()).toBe(403);
  const secret = process.env.QA_AUTH_OWNER_SECRET!;
  const valid = [-30000, 0, 30000].map((offset) => totp(secret, Date.now() + offset));
  const invalid = ["000000", "111111", "222222", "333333"].find((code) => !valid.includes(code))!;
  const failed = await page.request.post("/api/auth/mfa/verify", {
    data: { factorId: process.env.QA_AUTH_OWNER_FACTOR_ID, code: invalid },
    headers,
  });
  expect(failed.status()).toBe(422);
  await page.getByLabel("Six-digit security code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify and continue", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Your workspace." })).toBeVisible();
  expect((await page.request.get("/api/admin/permissions")).status()).toBe(200);
  await page.getByRole("link", { name: "Access and permissions", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Access and permissions." })).toBeVisible();
  await expect(page.locator(".whatsapp-button")).toBeHidden();
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "healthcare-admin")).toMatchObject({
    httpOnly: true,
    sameSite: "Strict",
  });
  expect(cookies.some((c) => c.name.startsWith("sb-"))).toBe(false);
  expect(
    await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
  ).toEqual({ local: 0, session: 0 });
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({ path: info.outputPath(`permissions-${width}.png`), fullPage: true });
  }
});
test("Receptionist cannot bypass Owner checks or deactivation using a direct URL/API", async ({
  page,
}) => {
  await login(page, "RECEPTIONIST");
  await expect(page.getByRole("link", { name: "Access and permissions", exact: true })).toHaveCount(
    0,
  );
  expect(
    (
      await page.request.get("/api/admin/permissions", {
        headers: { "x-role": "owner", "x-user-id": process.env.QA_AUTH_OWNER_ID! },
      })
    ).status(),
  ).toBe(403);
  await page.goto("/admin/access");
  await expect(page).toHaveURL(/\/admin\?denied=1$/);
  await admin`update healthcare.administrative_users set active=false where user_id=${process.env.QA_AUTH_RECEPTIONIST_ID!}`;
  try {
    expect((await page.request.get("/api/admin/session")).status()).toBe(401);
  } finally {
    await admin`update healthcare.administrative_users set active=true where user_id=${process.env.QA_AUTH_RECEPTIONIST_ID!}`;
  }
});
test("idle session expiry redirects to login and denies direct API access", async ({ page }) => {
  await login(page);
  await admin`update healthcare.administrative_sessions set last_seen_at=now()-interval '31 minutes' where user_id=${process.env.QA_AUTH_OWNER_ID!}`;
  expect((await page.request.get("/api/admin/session")).status()).toBe(401);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?/);
});
test("logout immediately invalidates a copied application cookie", async ({ page, request }) => {
  await login(page);
  const raw = (await page.context().cookies()).find((c) => c.name === "healthcare-admin")!.value;
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(
    (
      await request.get("/api/admin/session", { headers: { cookie: `healthcare-admin=${raw}` } })
    ).status(),
  ).toBe(401);
});
test("invalid, unprovisioned and inactive logins fail with the same safe message", async ({
  request,
}) => {
  const attempts = [
    { email: "missing-fictional@example.com", password: "Wrong-fictional-password-1!" },
    credentials("OUTSIDER"),
    credentials("INACTIVE"),
  ];
  for (const data of attempts) {
    const response = await request.post("/api/auth/login", { data, headers });
    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe("LOGIN_FAILED");
    expect(json.error.message).toBe(
      "Sign-in failed. Check your details or contact your administrator.",
    );
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
});
test("a real staff account can enroll and verify its first authenticator", async ({ page }) => {
  await firstFactor(page, "ENROLL");
  await page.getByRole("button", { name: "Set up authenticator", exact: true }).click();
  const secret = await page.getByLabel("Manual setup key").inputValue();
  expect(secret.length).toBeGreaterThan(10);
  await page.getByLabel("Six-digit security code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify and continue", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  expect((await page.request.get("/api/admin/session")).status()).toBe(200);
});
test("a real refresh preserves the absolute application session lifetime", async ({ page }) => {
  await login(page);
  const [row] =
    await admin`select * from healthcare.administrative_sessions where user_id=${process.env.QA_AUTH_OWNER_ID!} order by created_at desc limit 1`;
  const key = Buffer.from(process.env.QA_AUTH_ENCRYPTION_KEY!, "hex");
  const [, iv, tag, ciphertext] = row.encrypted_tokens.split(".");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(`healthcare-admin-v1:${row.key_hash}`));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  const pair = JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString(),
  );
  pair.expires_at = Math.floor(Date.now() / 1000) + 1;
  const nextIv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nextIv);
  cipher.setAAD(Buffer.from(`healthcare-admin-v1:${row.key_hash}`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(pair)), cipher.final()]);
  const sealed = [
    "v1",
    nextIv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
  await admin`update healthcare.administrative_sessions set encrypted_tokens=${sealed} where key_hash=${row.key_hash}`;
  const response = await page.request.get("/api/admin/session");
  expect(response.status()).toBe(200);
  expect((await response.json()).expiresAt).toBe(row.expires_at.toISOString());
  const [updated] =
    await admin`select encrypted_tokens from healthcare.administrative_sessions where key_hash=${row.key_hash}`;
  const [, updatedIv, updatedTag, updatedCiphertext] = updated.encrypted_tokens.split(".");
  const refreshedDecipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(updatedIv, "base64url"),
  );
  refreshedDecipher.setAAD(Buffer.from(`healthcare-admin-v1:${row.key_hash}`));
  refreshedDecipher.setAuthTag(Buffer.from(updatedTag, "base64url"));
  const refreshed = JSON.parse(
    Buffer.concat([
      refreshedDecipher.update(Buffer.from(updatedCiphertext, "base64url")),
      refreshedDecipher.final(),
    ]).toString(),
  );
  expect(refreshed.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000) + 100);
});
test("login layout is responsive and accessible without exposing staff records", async ({
  page,
}, info) => {
  await page.goto("/admin/login?next=https://evil.example");
  expect(await page.locator(".admin-auth-brand").evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(255, 255, 255)");
  expect(await page.getByLabel("Staff email", { exact: true }).evaluate(el => getComputedStyle(el).fontSize)).toBe("16px");
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({ path: info.outputPath(`staff-login-${width}.png`), fullPage: true });
  }
});
