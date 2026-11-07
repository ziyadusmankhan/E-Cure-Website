import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const slugs = [
  "online-consultation",
  "physiotherapy",
  "caretaker-services",
  "medical-equipment",
  "laboratory-services",
  "nursing-care",
];
const routes = [
  "/",
  "/about",
  "/services",
  "/faq",
  "/contact",
  "/privacy-policy",
  ...slugs.map((slug) => `/services/${slug}`),
];

test("every public page is complete, responsive and free of runtime errors", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    expect((await page.locator("main").innerText()).length, route).toBeGreaterThan(200);
    for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} at ${width}px`,
      ).toBe(true);
    }
    const name = route === "/" ? "home" : route.replaceAll("/", "-").slice(1);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({ path: testInfo.outputPath(`${name}-${width}.png`), fullPage: true });
    }
  }
  expect(errors).toEqual([]);
});
test("FAQ discovery, category anchors, keyboard answers and service links work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Read all frequently asked questions" }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await page
    .getByRole("navigation", { name: "Question topics" })
    .getByRole("link", { name: "Arranging a service" })
    .click();
  await expect(page).toHaveURL(/#appointment-requests$/);
  const question = page.getByRole("button", {
    name: "How do I book a service or order equipment?",
  });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("region", { name: "How do I book a service or order equipment?" }),
  ).toContainText("Call, email or message E-Cure on WhatsApp");
  await page.getByRole("main").getByRole("link", { name: "Nursing Care", exact: true }).click();
  await expect(page).toHaveURL(/\/services\/nursing-care$/);
});
test("each service CTA takes visitors to its direct booking contacts", async ({ page }) => {
  for (const slug of slugs) {
    await page.goto(`/services/${slug}`);
    await page.locator(".service-hero").getByRole("link", { name: "Contact for Booking" }).click();
    await expect(page).toHaveURL(/#service-contact$/);
    const contacts = page.locator("#service-contact");
    await expect(contacts.getByRole("link", { name: "+92 3394838347", exact: true })).toHaveAttribute("href", "tel:+923394838347");
    await expect(contacts.getByRole("link", { name: "+92 3394837347", exact: true })).toHaveAttribute("href", "tel:+923394837347");
    await expect(contacts.getByRole("link", { name: "ecurehomes@gmail.com" })).toHaveAttribute("href", "mailto:ecurehomes@gmail.com");
    await expect(contacts.locator('a[href="https://wa.me/923394838347"]')).toBeVisible();
  }
});
test("contact page shows the company details and offers direct contact only", async ({ page }) => {
  await page.goto("/contact");
  const main = page.getByRole("main");
  await expect(main.getByText("Mehboob Market, Service Road West, Street 5, F-12, Islamabad")).toBeVisible();
  await expect(main.locator('a[href="tel:+923394838347"]')).toBeVisible();
  await expect(main.locator('a[href="tel:+923394837347"]')).toBeVisible();
  await expect(main.locator('a[href="mailto:ecurehomes@gmail.com"]')).toBeVisible();
  await expect(main.locator('a[href="https://wa.me/923394838347"]')).toBeVisible();
  await expect(main.locator("form")).toHaveCount(0);
});
test("all public pages pass scoped accessibility checks", async ({ page }) => {
  test.setTimeout(180_000);
  // Measure contrast after entrance effects instead of sampling an animated opacity.
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of routes) {
    await page.goto(route);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations, `${route} ${width}: ${JSON.stringify(result.violations)}`).toEqual(
        [],
      );
    }
  }
});
