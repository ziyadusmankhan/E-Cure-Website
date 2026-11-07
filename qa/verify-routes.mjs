// Run after `npm run build` and `npm start`.
// No browser package or application dependency is needed for this smoke check.
import assert from "node:assert/strict";

const base = process.env.QA_BASE_URL || "http://localhost:3000";
const routes = [
  "/",
  "/about",
  "/services",
  "/services/online-consultation",
  "/services/physiotherapy",
  "/services/caretaker-services",
  "/services/medical-equipment",
  "/services/laboratory-services",
  "/services/nursing-care",
  "/contact",
  "/faq",
  "/privacy-policy",
];
const titles = new Set();
const internalLinks = new Set();
const assets = new Set();
const htmlByRoute = new Map();
for (const route of routes) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, `${route} must return HTTP 200`);
  const html = await response.text();
  htmlByRoute.set(route, html);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title, `${route} must have a page title`);
  assert.ok(!titles.has(title), `${route} must have a unique page title`);
  titles.add(title);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${route} must have one H1`);
  assert.match(html, /name="description"/, `${route} must have a meta description`);
  assert.match(html, /noindex/, `${route} must be excluded from indexing during demonstration`);
  for (const match of html.matchAll(/<a\b[^>]*href="(\/[^"\s]*)"/g)) {
    const href = match[1].replaceAll("&amp;", "&");
    if (!href.startsWith("/_next/") && !href.startsWith("/icon")) internalLinks.add(href);
  }
  for (const match of html.matchAll(/<img[^>]+src="([^"]+)"/g))
    assets.add(match[1].replaceAll("&amp;", "&"));
  console.log(`PASS ${route}`);
}
for (const href of internalLinks) {
  const url = new URL(href, base);
  const html = htmlByRoute.get(url.pathname);
  assert.ok(html, `Internal link has a supported route: ${href}`);
  if (url.hash) assert.ok(html.includes(`id="${url.hash.slice(1)}"`), `Anchor exists: ${href}`);
}
for (const src of assets) {
  const response = await fetch(new URL(src, base));
  assert.equal(response.status, 200, `Image must load: ${src}`);
  assert.match(
    response.headers.get("content-type") || "",
    /^image\//,
    `Asset must be an image: ${src}`,
  );
}
for (const route of ["/missing-page", "/services/missing-service"]) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 404, `${route} must return 404`);
}
console.log(
  `Verified ${routes.length} routes, ${internalLinks.size} internal destinations, ${assets.size} image URLs, and both 404 paths.`,
);
