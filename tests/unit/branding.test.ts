import { expect, it } from "vitest";
import { withEcureBranding } from "@/config/branding";
import { defaultProfile, profiles } from "@/config/profiles";
import { validateProfile } from "@/config/profile-utils";

it("keeps deployment identity while switching E-Cure to direct contact", () => {
  const original = structuredClone(defaultProfile);
  const branded = withEcureBranding(defaultProfile);
  expect(branded.id).toBe(defaultProfile.id);
  expect(branded.services.map(({ slug, enabled, kind }) => ({ slug, enabled, kind })))
    .toEqual(defaultProfile.services.map(({ slug, enabled, kind }) => ({ slug, enabled, kind })));
  expect(branded.features).toEqual({ ...defaultProfile.features, booking: false, inquiryForm: false });
  expect(branded.demo).toBe(true);
  expect(branded.contact).toMatchObject({
    phone: "+92 3394838347",
    secondaryPhone: "+92 3394837347",
    email: "ecurehomes@gmail.com",
    whatsappUrl: "https://wa.me/923394838347",
  });
  expect(validateProfile(branded)).toBe(branded);
  expect(defaultProfile).toEqual(original);
});

it("keeps alternate business profiles independent of the client presentation", () => {
  expect(profiles.default.presentation).toBe("ecure");
  for (const id of ["general-clinic", "home-care", "physiotherapy-center"]) {
    expect(profiles[id].presentation).toBeUndefined();
    expect(profiles[id].logo.src).not.toContain("branding/ecure");
  }
});
