import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const widths = [320, 375, 390, 430, 768, 1024, 1440];
test("three themes remain accessible and responsive at all target widths", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  await page.goto("/design-system");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("consistent design language");
  for (const theme of ["clinical-blue", "soft-teal", "warm-neutral"]) {
    await page.getByLabel("Theme preset").selectOption(theme);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${theme} at ${width}`,
      ).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${theme}-${width}.png`), fullPage: true });
    }
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    }
  }
});
test("dialog and field error behave with keyboard input", async ({ page }) => {
  await page.goto("/design-system");
  await page.getByRole("button", { name: "Open review dialog" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open review dialog" })).toBeFocused();
  await page.getByRole("button", { name: "Check example field" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Enter an example name." })).toBeVisible();
  await page.getByLabel("Example name", { exact: true }).fill("Example person");
  await page.getByRole("button", { name: "Check example field" }).click();
  await expect(page.getByLabel("Example name", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "false",
  );
});
test("public layouts reflow and reduced-motion hover has no transition", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.locator(".hero-image").hover();
  expect(
    await page.locator(".hero-image img").evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  await page.screenshot({ path: testInfo.outputPath("public-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath("public-mobile.png"), fullPage: true });
});
