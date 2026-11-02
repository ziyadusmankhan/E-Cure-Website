import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { bookingSchema, inquirySchema } from "@/lib/validations";
afterEach(() => vi.useRealTimers());
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2029, 0, 1));
});
const request = {
  service: "physiotherapy",
  name: "Example Person",
  phone: "+1 202 555 0100",
  email: "",
  date: "2030-04-15",
  time: "No preference",
  inquiry: "",
};
describe("demo request boundaries", () => {
  it("accepts minimal details without an optional email", () => {
    expect(bookingSchema.safeParse(request).success).toBe(true);
  });
  it.each([
    { service: "invented-service" },
    { phone: "abc" },
    { email: "invalid" },
    { date: "2030-02-30" },
    { inquiry: "x".repeat(501) },
  ])("rejects invalid request values %j", (change) => {
    expect(bookingSchema.safeParse({ ...request, ...change }).success).toBe(false);
  });
  it("rejects a past date at the local day boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2030, 3, 16, 0, 1));
    expect(bookingSchema.safeParse(request).success).toBe(false);
  });
  it("requires useful contact inquiry content", () => {
    expect(
      inquirySchema.safeParse({
        name: "Example Person",
        email: "example@example.com",
        topic: "Care options",
        message: "",
      }).success,
    ).toBe(false);
  });
});
