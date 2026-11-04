import { test, expect } from "@playwright/test";

test("hero image candidates cover their actual phone, tablet and desktop display width", async ({ page }, info) => {
  const results = [];
  for (const width of [375, 768, 980, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const hero = page.locator(".hero-image img");
    await hero.evaluate((image: HTMLImageElement) => image.decode());
    const image = await hero.evaluate((el: HTMLImageElement) => ({
      source: el.currentSrc,
      displayedWidth: el.getBoundingClientRect().width,
      density: devicePixelRatio,
    }));
    const candidateWidth = Number(new URL(image.source).searchParams.get("w"));
    // Allow small browser candidate rounding; reject a half-width tablet source.
    expect(candidateWidth, `Image must cover ${width}px viewport at ${image.density}x`).toBeGreaterThanOrEqual(Math.ceil(image.displayedWidth * image.density * 0.95));
    results.push({ viewport: width, ...image, candidateWidth });
  }
  await info.attach("responsive-image-candidates", { body: JSON.stringify(results, null, 2), contentType: "application/json" });
});
