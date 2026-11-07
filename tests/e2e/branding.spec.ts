import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("official artwork retains its frame in the public footer and staff login", async ({ page }) => {
  for (const route of ["/", "/admin/login"]) {
    await page.goto(route);
    const scope = route === "/" ? page.locator(".site-footer") : page.locator(".admin-auth-brand");
    for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const frame = await scope.locator(".brand-artwork").boundingBox();
      const artwork = await scope.locator(".brand-artwork img").boundingBox();
      expect(frame).not.toBeNull();
      expect(artwork).not.toBeNull();
      expect(Math.abs(artwork!.width - frame!.width * 1536 / 1320), `${route} artwork frame at ${width}px`).toBeLessThanOrEqual(1);
      expect(frame!.x).toBeGreaterThanOrEqual(0);
      expect(frame!.x + frame!.width).toBeLessThanOrEqual(width);
    }
  }
});

test("client colors and official artwork survive public page navigation", async ({ page }) => {
  await page.goto("/");
  const readBrand = () => page.locator("html").evaluate(el => {
    const style = getComputedStyle(el);
    return { blue: style.getPropertyValue("--blue").trim(), action: style.getPropertyValue("--green").trim() };
  });
  expect(await readBrand()).toEqual({ blue: "#075A9E", action: "#247D29" });
  await page.getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "About Us", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  expect(await readBrand()).toEqual({ blue: "#075A9E", action: "#247D29" });
  await expect(page.getByRole("banner").getByRole("img", { name: "E-Cure Home Health Services" }))
    .toHaveAttribute("src", /ecure-official-logo/);
});

test("E-Cure artwork, typography and request access reflow across all target widths", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-presentation", "ecure");
  const logo = page.getByRole("banner").getByRole("img", { name: "E-Cure Home Health Services" });
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  expect(await page.locator("body").evaluate(el => getComputedStyle(el).fontFamily)).toContain("Inter");
  expect(await page.locator("h1").evaluate(el => getComputedStyle(el).fontFamily)).toContain("Manrope");
  expect(await page.getByRole("banner").evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(255, 255, 255)");
  await expect(logo).toHaveAttribute("src", /ecure-official-logo/);
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    // Responsive image candidates round their raster dimensions. Check the
    // displayed artwork against the source ratio with one CSS pixel tolerance.
    const box = await logo.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.height - box!.width * 1024 / 1536), `Unstretched official artwork at ${width}px`).toBeLessThanOrEqual(1);
    const frame = await page.getByRole("banner").locator(".brand-artwork").boundingBox();
    expect(frame).not.toBeNull();
    expect(frame!.width, `Readable logo width at ${width}px`).toBeGreaterThanOrEqual(128);
    expect(frame!.x).toBeGreaterThanOrEqual(0);
    expect(frame!.x + frame!.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px`).toBe(true);
    await expect(page.getByRole("banner").getByRole("link", { name: "Contact for Booking" }).filter({ visible: true })).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Main navigation", exact: true })).toBeVisible({ visible: width >= 1024 });
    await page.screenshot({ path: info.outputPath(`ecure-home-${width}.png`), fullPage: true });
  }
});

test("mobile services expand by keyboard and the modal restores focus and scrolling", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  const services = dialog.getByRole("button", { name: "Services", exact: true });
  await expect(services).toHaveAttribute("aria-expanded", "false");
  await expect(dialog.getByRole("link", { name: "Physiotherapy", exact: true })).toBeHidden();
  await services.focus();
  await page.keyboard.press("Enter");
  await expect(services).toHaveAttribute("aria-expanded", "true");
  await expect(dialog.getByRole("link", { name: "Physiotherapy", exact: true })).toBeVisible();
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("ecure-mobile-menu-expanded.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.locator("body").evaluate(el => getComputedStyle(el).overflow)).not.toBe("hidden");
  await trigger.click();
  await expect(services).toHaveAttribute("aria-expanded", "false");
  await services.click();
  await dialog.getByRole("link", { name: "Physiotherapy", exact: true }).click();
  await expect(page).toHaveURL(/\/services\/physiotherapy$/);
  await expect(dialog).toHaveCount(0);
});

test("desktop services remain keyboard accessible and a mobile modal closes on desktop resize", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const services = page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: "Services" });
  await services.focus();
  await page.keyboard.press("Enter");
  await expect(services).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".services-dropdown").getByRole("link", { name: "Nursing Care" })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(services).toHaveAttribute("aria-expanded", "false");
  await expect(services).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".services-dropdown").getByRole("link", { name: "Online Consultation" })).toBeFocused();
  await page.locator("h1").click();
  await expect(services).toHaveAttribute("aria-expanded", "false");
  await page.mouse.move(0, 0);
  await services.hover();
  const firstService = page.locator(".services-dropdown").getByRole("link", { name: "Online Consultation" });
  await expect(firstService).toBeVisible();
  const linkBox = await firstService.boundingBox();
  await page.mouse.move(linkBox!.x + linkBox!.width / 2, linkBox!.y + linkBox!.height / 2, { steps: 15 });
  await expect(firstService).toBeVisible();
  await page.locator("h1").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
