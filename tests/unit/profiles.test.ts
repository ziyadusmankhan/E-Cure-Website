import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { profiles, getProfile } from "@/config/profiles";
import { activeServices, publicPaths, visibleLinks, validateProfile } from "@/config/profile-utils";
import { createBookingSchema } from "@/lib/validations";
import { defaultCopy } from "@/config/content/default-copy";
it("isolates per-business visibility flags from the default and other profiles", () => {
  expect(profiles.default.sections.about).toBe(true);
  expect(profiles.default.features.whatsapp).toBe(true);
  expect(profiles.default.features).toMatchObject({ inquiryForm: false, booking: false });
  expect(profiles["general-clinic"].sections.whyHomeCare).toBe(false);
  expect(profiles["home-care"].sections.about).toBe(false);
  expect(profiles["physiotherapy-center"].features.inquiryForm).toBe(false);
  expect(profiles["general-clinic"].sections).not.toBe(profiles["home-care"].sections);
});
for (const [id, profile] of Object.entries(profiles))
  describe(id, () => {
    it("has complete copy, a valid configuration and local artwork", () => {
      expect(validateProfile(profile)).toBe(profile);
      expect(Object.keys(profile.copy).sort()).toEqual(Object.keys(defaultCopy).sort());
      for (const image of [
        profile.media.hero.src,
        profile.media.about.src,
        profile.logo.src,
        ...activeServices(profile).map((s) => s.image),
      ].filter(Boolean))
        expect(existsSync(`public${image}`), image).toBe(true);
    });
    it("filters disabled services from routes, related services and intake", () => {
      const enabled = activeServices(profile),
        allowed = enabled.map((s) => s.slug),
        paths = publicPaths(profile);
      for (const service of enabled) {
        expect(paths).toContain(`/services/${service.slug}`);
        expect(service.related.every((slug) => allowed.includes(slug))).toBe(true);
      }
      const schema = createBookingSchema(enabled),
        input = {
          name: "Example Person",
          phone: "+1 202 555 0100",
          email: "",
          date: "2099-01-01",
          time: "No preference",
          inquiry: "",
        };
      expect(schema.safeParse({ ...input, service: allowed[0] }).success).toBe(true);
      for (const service of profile.services.filter((s) => !s.enabled)) {
        expect(paths).not.toContain(`/services/${service.slug}`);
        expect(schema.safeParse({ ...input, service: service.slug }).success).toBe(false);
      }
    });
    it("removes hidden-section anchors", () => {
      expect(
        visibleLinks(profile.navigation.main, profile).every(
          (link) => !link.section || profile.sections[link.section],
        ),
      ).toBe(true);
    });
  });
it("provides three distinct fictional configurations", () => {
  const fixtures = Object.values(profiles).filter((p) => p.fixture);
  expect(fixtures).toHaveLength(3);
  expect(new Set(fixtures.map((p) => p.name)).size).toBe(3);
  expect(new Set(fixtures.map((p) => p.theme)).size).toBe(3);
  expect(fixtures.every((p) => p.demo && p.name.includes("Demo"))).toBe(true);
});
it("fails explicitly on unknown profile identifiers", () => {
  expect(() => getProfile("unknown")).toThrow("Unknown public site profile");
});
it("rejects duplicate slugs, missing services and unsafe URLs", () => {
  const p = structuredClone(profiles.default);
  p.services[1].slug = p.services[0].slug;
  expect(() => validateProfile(p)).toThrow("Duplicate");
  expect(() => validateProfile({ ...profiles.default, services: [] })).toThrow("at least one");
  expect(() => validateProfile({ ...profiles.default, url: "javascript:alert(1)" })).toThrow(
    "HTTP(S)",
  );
  expect(() => validateProfile({ ...profiles["general-clinic"], demo: false })).toThrow(
    "demonstrations",
  );
});
