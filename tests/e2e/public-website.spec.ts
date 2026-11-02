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
  "/book-appointment",
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
    for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
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
    .getByRole("link", { name: "Understanding appointment requests" })
    .click();
  await expect(page).toHaveURL(/#appointment-requests$/);
  const question = page.getByRole("button", {
    name: "Does completing the form book an appointment?",
  });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("region", { name: "Does completing the form book an appointment?" }),
  ).toContainText("not a confirmed appointment");
  await expect(
    page.getByRole("region", { name: "Does completing the form book an appointment?" }),
  ).toContainText("Preview mode does not submit entries");
  await page.getByRole("main").getByRole("link", { name: "Nursing Care", exact: true }).click();
  await expect(page).toHaveURL(/\/services\/nursing-care$/);
});
test("each service CTA prefills its own service", async ({ page }) => {
  for (const slug of slugs) {
    await page.goto(`/services/${slug}`);
    await page.getByRole("link", { name: "Request this service" }).click();
    await expect(page.locator(`input[type="radio"][value="${slug}"]`)).toBeChecked();
  }
});
test("contact form validates and resets without sending a message", async ({ page }) => {
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") submissions.push(request.url());
  });
  await page.goto("/contact");
  await page.getByRole("button", { name: "Preview inquiry completion" }).click();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("Your name", { exact: true }).fill("Example Person");
  await page.getByLabel("Email address", { exact: true }).fill("example@example.com");
  await page.getByLabel("Topic", { exact: true }).selectOption("Exploring care options");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("Example inquiry about care arrangements.");
  await page.getByRole("button", { name: "Preview inquiry completion" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "This is a demonstration. Your request has not been submitted or saved.",
  );
  await page.getByRole("button", { name: "Try another inquiry" }).click();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("");
  expect(submissions).toEqual([]);
});
test("core public pages pass scoped accessibility checks", async ({ page }) => {
  test.setTimeout(120_000);
  for (const route of ["/", "/faq", "/contact", "/book-appointment"]) {
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
