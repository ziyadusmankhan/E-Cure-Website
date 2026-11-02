import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { getProfile } from "../../src/config/profiles";
import { activeServices, publicPaths, visibleLinks } from "../../src/config/profile-utils";
const profile = getProfile(process.env.NEXT_PUBLIC_SITE_PROFILE);
const services = activeServices(profile);
test("selected deployment has its own brand, content, theme and feature visibility", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-profile", profile.id);
  await expect(page.locator("html")).toHaveAttribute("data-theme", profile.theme);
  await expect(page).toHaveTitle(new RegExp(profile.shortName));
  await expect(
    page.getByRole("banner").getByRole("link", { name: `${profile.name} home` }),
  ).toBeVisible();
  await expect(page.getByRole("banner").getByRole("img")).toHaveAttribute(
    "src",
    new RegExp(profile.logo.src),
  );
  await expect(page.locator("h1")).toContainText(profile.copy.home_compassionate_2);
  for (const [flag, selector] of Object.entries({
    about: "#about",
    services: "#services",
    whyHomeCare: "#why-home-care",
    howItWorks: "#how-it-works",
    questions: "#questions",
    contact: "#contact",
  }))
    await expect(page.locator(selector)).toHaveCount(
      profile.sections[flag as keyof typeof profile.sections] ? 1 : 0,
    );
  await expect(page.getByRole("button", { name: "WhatsApp contact information" })).toHaveCount(
    profile.features.whatsapp ? 1 : 0,
  );
  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${profile.id} ${width}`,
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const menu = page.getByRole("dialog");
  for (const link of visibleLinks(profile.navigation.main, profile))
    await expect(menu.getByRole("link", { name: link.label, exact: true })).toBeVisible();
  for (const service of services)
    await expect(menu.getByRole("link", { name: service.title, exact: true })).toBeVisible();
  for (const disabled of profile.services.filter((s) => !s.enabled))
    await expect(menu.locator(`a[href="/services/${disabled.slug}"]`)).toHaveCount(0);
  await menu.getByRole("link", { name: services[0].title, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("disabled services cannot leak into directories, related links, routes or intake", async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of publicPaths(profile)) {
    expect((await page.goto(route))?.status(), route).toBe(200);
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        route,
      ).toBe(true);
    }
    for (const disabled of profile.services.filter((s) => !s.enabled))
      await expect(page.locator(`a[href="/services/${disabled.slug}"]`)).toHaveCount(0);
  }
  for (const disabled of profile.services.filter((s) => !s.enabled))
    expect((await request.get(`/services/${disabled.slug}`)).status()).toBe(404);
  await page.goto("/services");
  await expect(page.locator("main .service-card")).toHaveCount(services.length);
  for (const service of services) {
    await page.goto(`/services/${service.slug}`);
    await page.getByRole("link", { name: "Request this service" }).click();
    await expect(page.locator(`input[value="${service.slug}"]`)).toBeChecked();
  }
  await page.goto("/book-appointment?service=medical-equipment");
  await expect(page.getByRole("radio")).toHaveCount(services.length);
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Please choose a service.", { exact: true })).toBeVisible();
  await page.goto("/contact");
  await expect(page.getByRole("button", { name: "Preview inquiry completion" })).toHaveCount(
    profile.features.inquiryForm ? 1 : 0,
  );
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/services/");
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
  expect(errors).toEqual([]);
});
test("selected theme renders accessible homepage and service content", async ({ page }) => {
  for (const route of ["/", `/services/${services[0].slug}`]) {
    await page.goto(route);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations, JSON.stringify(result.violations)).toEqual([]);
    }
  }
});
