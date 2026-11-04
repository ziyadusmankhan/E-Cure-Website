import { test, expect } from "@playwright/test";

test("official logo has a readable subtitle beneath its artwork in every placement", async ({ page }) => {
  for (const route of ["/", "/admin/login"]) {
    await page.goto(route);
    for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const scope = route === "/" ? page.getByRole("banner") : page.locator(".admin-auth-brand");
      const logo = scope.locator(".brand-artwork");
      const tagline = scope.locator(".brand-tagline");
      await expect(tagline).toHaveText(/home health services/i);
      const art = await logo.boundingBox();
      const text = await tagline.boundingBox();
      expect(text!.y).toBeGreaterThanOrEqual(art!.y + art!.height);
      expect(text!.x).toBeGreaterThanOrEqual(0);
      expect(text!.x + text!.width).toBeLessThanOrEqual(width);
      expect(await tagline.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      if (route === "/") {
        const header = await page.getByRole("banner").boundingBox();
        expect(text!.y + text!.height).toBeLessThanOrEqual(header!.y + header!.height);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.goto("/");
  await expect(page.locator(".site-footer .brand-tagline")).toHaveText(/home health services/i);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog").locator(".brand-tagline")).toHaveText(/home health services/i);
});

test("animated services disclosure tolerates pointer travel and cancels delayed reopening", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const trigger = page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: "Services", exact: true });
  const panel = page.locator(".services-dropdown");
  await trigger.hover();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(await panel.evaluate(el => getComputedStyle(el).animationName)).not.toBe("none");
  const box = await panel.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y - 3);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + 35);
  await expect(panel).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(panel).toBeHidden();
  await trigger.hover();
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(panel.getByRole("link", { name: "Online Consultation", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  // A queued hover must not reopen after keyboard dismissal.
  await page.waitForTimeout(250);
  await expect(panel).toBeHidden();
});

test("reduced motion keeps content and disclosures visible without entrance movement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  expect(await page.locator("h1").evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  await page.setViewportSize({ width: 1440, height: 900 });
  const trigger = page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: "Services", exact: true });
  await trigger.hover();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await trigger.click();
  const panel = page.locator(".services-dropdown");
  await expect(panel).toBeVisible();
  expect(await panel.evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Services", exact: true }).click();
  await expect(dialog.getByRole("link", { name: "Nursing Care", exact: true })).toBeVisible();
  expect(await page.locator(".mobile-services-list").evaluate(el => getComputedStyle(el).animationName)).toBe("none");
});
