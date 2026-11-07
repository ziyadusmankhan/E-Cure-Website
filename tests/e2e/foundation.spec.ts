import { test, expect } from "@playwright/test";
const routes = [
  "/",
  "/about",
  "/services",
  "/contact",
  "/faq",
  "/privacy-policy",
  ...[
    "online-consultation",
    "physiotherapy",
    "caretaker-services",
    "medical-equipment",
    "laboratory-services",
    "nursing-care",
  ].map((slug) => `/services/${slug}`),
];
test("existing routes, service links, and image assets remain accessible", async ({ page }) => {
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    for (const image of await page.locator("main img").all()) {
      const src = await image.getAttribute("src");
      expect((await page.request.get(src!)).ok(), src!).toBeTruthy();
    }
  }
});
test("mobile navigation closes after following a service", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Services", exact: true }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Physiotherapy", exact: true }).click();
  await expect(page).toHaveURL(/services\/physiotherapy$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("direct booking keeps the visitor on the selected service", async ({ page }) => {
  await page.goto("/services/physiotherapy");
  await page.locator(".service-hero").getByRole("link", { name: "Contact for Booking" }).click();
  await expect(page).toHaveURL(/\/services\/physiotherapy#service-contact$/);
  await expect(page.getByRole("region", { name: "Contact us about Physiotherapy" })).toBeVisible();
  await expect(page.locator("main form")).toHaveCount(0);
});
