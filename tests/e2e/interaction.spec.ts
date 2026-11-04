import { test, expect } from "@playwright/test";
const widths = [320, 375, 390, 430, 768, 1024, 1280, 1440];

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
