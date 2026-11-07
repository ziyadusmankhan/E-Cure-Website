import { test, expect } from "@playwright/test";
import { publicPaths } from "../../src/config/profile-utils";
import { profiles } from "../../src/config/profiles";

const routes = publicPaths(profiles.default);

test("public metadata is unique and complete while the review deployment remains excluded from indexing", async ({ page, request }, info) => {
  test.setTimeout(120_000);
  const titles = new Set<string>();
  const results = [];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("main h1")).toHaveCount(1);
    const title = await page.title();
    expect(title.length, route).toBeGreaterThan(10);
    expect(titles.has(title), `Duplicate title at ${route}`).toBe(false);
    titles.add(title);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length, route).toBeGreaterThan(30);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /\S/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /\S/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    const canonicalHref = await canonical.getAttribute("href");
    expect(new URL(canonicalHref ?? "").href, route).toBe(`https://www.ecurehomes.com${route}`);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /width=device-width/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    results.push({ route, title, description });
  }
  expect(await (await request.get("/robots.txt")).text()).toMatch(/Disallow:\s*\//);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("<loc>");
  for (const route of ["/missing-page", "/services/missing-service", "/design-system"])
    expect((await request.get(route)).status(), route).toBe(404);
  expect(await (await request.get("/services/missing-service")).text()).not.toMatch(
    /<link rel="canonical"/,
  );
  await info.attach("public-metadata", { body: JSON.stringify(results, null, 2), contentType: "application/json" });
});

test("the skip link places keyboard navigation in the main content", async ({ page }) => {
  for (const route of ["/", "/services/nursing-care", "/about", "/contact"]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content", exact: true });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    await page.keyboard.press("Tab");
    expect(await page.locator("main").evaluate(main => main.contains(document.activeElement)), route).toBe(true);
  }
});

test("public images finish loading at mobile and desktop widths", async ({ page }, info) => {
  test.setTimeout(180_000);
  for (const route of ["/", "/about", "/services", "/services/nursing-care", "/services/medical-equipment"]) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      await page.evaluate(async () => {
        await document.fonts.ready;
        for (let top = 0; top < document.documentElement.scrollHeight; top += 700) {
          window.scrollTo({ top, behavior: "instant" });
          await new Promise(resolve => setTimeout(resolve, 40));
        }
        window.scrollTo({ top: 0, behavior: "instant" });
      });
      await expect.poll(() => page.locator("img").evaluateAll(images => images.filter(image => image instanceof HTMLImageElement && (!image.complete || image.naturalWidth === 0)).map(image => image.getAttribute("src")))).toEqual([]);
      expect(await page.locator("img:not([alt])").count()).toBe(0);
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
      const name = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
      await page.screenshot({ path: info.outputPath(`loaded-${name}-${width}.png`), fullPage: true });
    }
  }
});
