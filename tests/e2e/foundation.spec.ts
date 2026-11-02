import { test, expect } from "@playwright/test";
const routes = ["/", "/about", "/services", "/contact", "/book-appointment", "/privacy-policy", ...["online-consultation", "physiotherapy", "caretaker-services", "medical-equipment", "laboratory-services", "nursing-care"].map(slug => `/services/${slug}`)];
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
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("link", { name: "Physiotherapy", exact: true }).click();
  await expect(page).toHaveURL(/services\/physiotherapy$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("booking retains service context and completes truthfully", async ({ page }) => {
  await page.goto("/services/physiotherapy");
  await page.getByRole("link", { name: "Request this service" }).click();
  await expect(page.getByRole("radio", { name: "Physiotherapy", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Review request", exact: true }).click();
  await expect(page.getByLabel("Patient or contact name")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Patient or contact name").fill("Example Person");
  await page.getByLabel("Contact number", { exact: true }).fill("+1 202 555 0100");
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  await page.getByLabel("Preferred date", { exact: true }).fill(`${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,"0")}-${String(tomorrow.getDate()).padStart(2,"0")}`);
  await page.getByLabel("Preferred time window").selectOption("No preference");
  await page.getByRole("button", { name: "Review request", exact: true }).click();
  await expect(page.getByText("Example Person", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Complete demo", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("This is a demonstration. Your request has not been submitted or saved.");
});
