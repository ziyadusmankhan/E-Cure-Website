import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { activeServices } from "../../src/config/profile-utils";
import { profiles } from "../../src/config/profiles";

test("the public presentation keeps configured services, metadata and original brand artwork", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Compassionate Care at Home");
  await expect(page.locator(".hero-actions").getByRole("link", { name: "Book Appointment" })).toHaveAttribute("href", "/book-appointment");
  expect(await page.locator("#services .service-card").evaluateAll(links => links.map(link => link.getAttribute("href"))))
    .toEqual(activeServices(profiles.default).map(service => `/services/${service.slug}`));
  await expect(page.locator(".testimonial-section")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_PK");
  const href = await page.locator('link[rel="icon"]').first().getAttribute("href");
  const icon = await request.get(href!);
  expect(icon.ok()).toBe(true);
  expect(icon.headers()["content-type"]).toContain("image/png");
  expect((await icon.body()).equals(readFileSync("public/images/branding/ecure-official-icon.png"))).toBe(true);
  await page.goto("/services/nursing-care");
  await expect(page).toHaveTitle(/Nursing Care in Islamabad/);
  await expect(page.getByRole("link", { name: "Request this service" })).toHaveAttribute("href", "/book-appointment?service=nursing-care");
});

test("light page surfaces and client photography retain the new public identity", async ({ page }) => {
  for (const [route, surface] of [["/", ".hero"], ["/about", ".page-intro"], ["/services", ".page-intro"], ["/services/physiotherapy", ".service-hero"], ["/contact", ".page-intro"], ["/faq", ".page-intro"], ["/book-appointment", ".booking-page"]]) {
    await page.goto(route);
    expect(await page.locator(surface).evaluate(el => getComputedStyle(el).backgroundColor), route).toBe("rgb(244, 248, 251)");
    expect(await page.locator("main h1").evaluate(el => getComputedStyle(el).color), route).toBe("rgb(11, 50, 95)");
    if (route === "/about") await expect(page.locator("main .about-image img")).toHaveAttribute("src", /islamabad-landmark/);
    if (route === "/services/physiotherapy") await expect(page.locator(".service-hero-image img")).toHaveAttribute("src", /physiotherapy-treatment/);
    if (route === "/contact") await expect(page.locator(".contact-location-photo img")).toHaveAttribute("src", /islamabad-panorama/);
  }
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/");
  const copy = await page.locator(".hero-copy").boundingBox();
  const photo = await page.locator(".hero-visual").boundingBox();
  expect(photo!.y, "Tablet photo sits below the copy to retain both people").toBeGreaterThanOrEqual(copy!.y + copy!.height);
  expect(photo!.width).toBe(768);
});

test("booking selection, details and review remain usable at all requested widths", async ({ page }) => {
  const widths = [320, 375, 390, 430, 768, 1024, 1280, 1440];
  const checkLayout = async () => {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px`).toBe(true);
      const controls = page.locator(".booking-form input:visible, .booking-form select:visible, .booking-form textarea:visible, .booking-form button:visible");
      for (const control of await controls.all()) {
        const box = await control.boundingBox();
        expect(box!.x, `Control left edge at ${width}px`).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width, `Control right edge at ${width}px`).toBeLessThanOrEqual(width);
      }
    }
  };
  await page.goto("/book-appointment?service=physiotherapy");
  await checkLayout();
  await expect(page.getByRole("radio", { name: "Physiotherapy", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Patient or contact name").fill("Example Family");
  await page.getByLabel("Contact number", { exact: true }).fill("+1 202 555 0100");
  const date = new Date(); date.setDate(date.getDate() + 1);
  await page.getByLabel("Preferred date", { exact: true }).fill(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`);
  await page.getByLabel("Preferred time window").selectOption("No preference");
  await checkLayout();
  await page.getByRole("button", { name: "Review request", exact: true }).click();
  await expect(page.getByText("Example Family", { exact: true })).toBeVisible();
  await checkLayout();
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await expect(page.getByLabel("Patient or contact name")).toHaveValue("Example Family");
});

test("the mobile booking journey preserves details through review and edit without sending a request", async ({ page }, info) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".hero-actions").getByRole("link", { name: "Book Appointment" }).click();
  await page.getByRole("radio", { name: "Nursing Care", exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Patient or contact name").fill("Example Family");
  await page.getByLabel("Contact number", { exact: true }).fill("+1 202 555 0100");
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const tomorrow = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  await page.getByLabel("Preferred date", { exact: true }).fill(tomorrow);
  await page.getByLabel("Preferred time window").selectOption("No preference");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("booking-details-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Review request", exact: true }).click();
  await expect(page.getByText("Example Family", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await expect(page.getByLabel("Patient or contact name")).toHaveValue("Example Family");
  await page.getByLabel("Patient or contact name").fill("Example Family Updated");
  await page.getByRole("button", { name: "Review request", exact: true }).click();
  await expect(page.getByText("Example Family Updated", { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath("booking-review-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Complete demo", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("This is a demonstration. Your request has not been submitted or saved.");
  expect(posts).toEqual([]);
});
