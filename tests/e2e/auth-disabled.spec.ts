import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("unconfigured staff authentication fails closed and its login page stays accessible", async ({
  page,
  request,
}, info) => {
  const response = await page.goto("/admin/login?next=//evil.example");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in securely" })).toBeDisabled();
  for (const path of ["/admin", "/admin/access", "/admin/mfa"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login\?/);
  }
  expect(
    (
      await request.post("/api/auth/login", {
        data: { email: "fictional@example.com", password: "fictional" },
        headers: { origin: "http://127.0.0.1:3100" },
      })
    ).status(),
  ).toBe(503);
  expect((await request.get("/api/admin/permissions")).status()).toBe(503);
  expect((await request.post("/api/auth/signup", { data: {} })).status()).toBe(404);
  await page.goto("/admin/login");
  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
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
    await page.screenshot({
      path: info.outputPath(`staff-login-disabled-${width}.png`),
      fullPage: true,
    });
  }
});
