import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { activeServices } from "../../src/config/profile-utils";
import { profiles } from "../../src/config/profiles";

test("the public presentation keeps configured services, metadata and original brand artwork", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Compassionate Care at Home");
  await expect(page.locator(".hero-actions").getByRole("link", { name: "Contact for Booking" })).toHaveAttribute("href", "/contact");
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
  await expect(page.locator(".service-hero").getByRole("link", { name: "Contact for Booking" })).toHaveAttribute("href", "#service-contact");
});

test("light page surfaces and client photography retain the new public identity", async ({ page }) => {
  for (const [route, surface] of [["/", ".hero"], ["/about", ".page-intro"], ["/services", ".page-intro"], ["/services/physiotherapy", ".service-hero"], ["/contact", ".page-intro"], ["/faq", ".page-intro"]]) {
    await page.goto(route);
    expect(await page.locator(surface).evaluate(el => getComputedStyle(el).backgroundColor), route).toBe("rgb(244, 248, 251)");
    expect(await page.locator("main h1").evaluate(el => getComputedStyle(el).color), route).toBe("rgb(11, 50, 95)");
    if (route === "/about") await expect(page.locator("main .about-image img")).toHaveAttribute("src", /home-sample-collection/);
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

test("old appointment bookmarks open direct contacts on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/book-appointment?service=physiotherapy");
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator("main form")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Contact us on WhatsApp" })).toHaveAttribute(
    "href",
    "https://wa.me/923394838347",
  );
});

test("the About page displays two physiotherapist profiles and the six staff counts", async ({ page }, info) => {
  await page.goto("/about#meet-our-staff");
  const profiles = page.locator(".ecure-staff-profiles");
  const cards = profiles.getByRole("listitem");
  await expect(cards.getByRole("heading")).toHaveText(["Dr Daim Aziz", "Dr Muhammad"]);
  await expect(cards.getByText("Physiotherapist (DPT)", { exact: true })).toHaveCount(2);
  await expect(cards.getByRole("img", { name: "Portrait of Dr Muhammad" })).toHaveAttribute("src", /dr-muhammad-portrait\.jpg/);
  await expect(cards.getByRole("img", { name: "Portrait of Dr Daim Aziz" })).toHaveAttribute("src", /dr-daim-aziz\.jpg/);

  const staff = page.getByRole("region", { name: "Our Staff", exact: true });
  await expect(staff.getByRole("listitem")).toHaveText([
    /Physiotherapists\s*8 doctors/,
    /Nurses\s*35 registered nurses/,
    /Caretakers\s*15 caretakers/,
    /Respiratory Therapists\s*5 respiratory therapists/,
    /Speech Therapists\s*5 speech therapists/,
    /Medical Consultants\s*10 medical consultants/,
  ]);

  for (const width of [320, 390, 639, 640, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const portrait of await cards.getByRole("img").all()) {
      await portrait.scrollIntoViewIfNeeded();
      await portrait.evaluate((image: HTMLImageElement) => image.decode());
    }
    const first = (await cards.nth(0).boundingBox())!;
    const second = (await cards.nth(1).boundingBox())!;
    if (width < 640) {
      expect(second.x).toBe(first.x);
      expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
    } else {
      expect(second.y).toBe(first.y);
      expect(second.x).toBeGreaterThanOrEqual(first.x + first.width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390 || width === 1440)
      await profiles.screenshot({ path: info.outputPath(`staff-profiles-${width}.png`) });
  }
});
