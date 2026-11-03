import { it, expect } from "vitest";
import {
  adminDestinations,
  safeAdminNext,
  isAdminNavigation,
} from "../../src/lib/admin-navigation";
it("allows only known internal admin destinations and their exact MFA handoffs", () => {
  for (const path of adminDestinations) {
    expect(safeAdminNext(path)).toBe(path);
    expect(isAdminNavigation(path)).toBe(true);
    expect(isAdminNavigation(`/admin/mfa?next=${encodeURIComponent(path)}`)).toBe(true);
  }
  expect(isAdminNavigation("/admin/login")).toBe(true);
});
it("rejects external, ambiguous and injected redirects in both browser and server policy", () => {
  for (const path of [
    "https://evil.example",
    "//evil.example",
    "/admin/../external",
    "/admin\\evil",
    "/admin?next=//evil",
    "/admin/website?next=//evil",
    "/admin/mfa?next=%2F%2Fevil",
    "/admin/mfa?next=%2Fadmin&extra=1",
    "/admin/mfa?next=/admin",
    "%2f%2fevil",
    "/admin/website\n",
  ]) {
    expect(safeAdminNext(path)).toBe("/admin");
    expect(isAdminNavigation(path)).toBe(false);
  }
});
