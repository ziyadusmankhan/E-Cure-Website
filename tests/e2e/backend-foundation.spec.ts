import { test, expect } from "@playwright/test";

test("disabled submission mode rejects writes and does not expose private reads", async ({
  request,
}) => {
  for (const path of ["/api/appointments", "/api/inquiries"]) {
    expect((await request.get(path)).status()).toBe(405);
    expect((await request.post(path, { data: { example: "fictional" } })).status()).toBe(503);
  }
  const admin = await request.get("/admin", { maxRedirects: 0 });
  expect(admin.status()).toBe(307);
  expect(admin.headers().location).toContain("/admin/login");
  expect((await request.get("/api/admin/session")).status()).toBe(503);
});
