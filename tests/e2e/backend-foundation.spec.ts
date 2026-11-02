import { test, expect } from "@playwright/test";

test("backend foundation does not activate public mutation or admin endpoints", async ({
  request,
}) => {
  for (const path of ["/api/appointments", "/api/inquiries"]) {
    expect((await request.get(path)).status()).toBe(404);
    expect((await request.post(path, { data: { example: "fictional" } })).status()).toBe(404);
  }
  expect((await request.get("/admin")).status()).toBe(404);
});
