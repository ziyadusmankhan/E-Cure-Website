import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { clientThemes, presentationStyle } from "@/config/client-presentation";
import { brandArtwork, clientPhoto, ecureAssets, ecurePhotography } from "@/config/branding";

function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map(v => parseInt(v, 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}

it("has readable E-Cure text, action and control contrast on its light surfaces", () => {
  const theme = clientThemes.ecure;
  for (const surface of ["#ffffff", theme["--paper"], theme["--mint"]]) {
    for (const token of ["--blue", "--green", "--ink", "--body-text", "--muted"] as const)
      expect(contrast(theme[token], surface), `${token} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme["--control-border"], surface)).toBeGreaterThanOrEqual(3);
  }
});

it("preserves CMS color precedence and leaves other client presets unaltered", () => {
  expect(presentationStyle("ecure", { primary: "#123456", secondary: "#234567" }))
    .toMatchObject({ "--blue": "#123456", "--green": "#234567", "--ink": "#0B325F" });
  expect(presentationStyle(undefined, { primary: "", secondary: "" })).toEqual({});
  expect(presentationStyle(undefined, { primary: "#123456", secondary: "" }))
    .toEqual({ "--blue": "#123456" });
});

it("uses the supplied official JPEG without altering its bytes", () => {
  const bytes = readFileSync(`public${ecureAssets.logo}`);
  expect(createHash("sha256").update(bytes).digest("hex"))
    .toBe("5b1a874e6bbc81cd1fb3c085d05eaacf38ae39bc670604beff4eccff4367814b");
});

it("updates known legacy artwork references while honoring custom CMS logos", () => {
  expect(brandArtwork({ presentation: "ecure", logo: { src: "/images/branding/ecure-logo.webp", alt: "E-Cure" } }))
    .toEqual({ src: ecureAssets.logo, official: true });
  expect(brandArtwork({ presentation: "ecure", logo: { src: "/api/media/approved-logo", alt: "Client logo" } }))
    .toEqual({ src: "/api/media/approved-logo", official: false });
  expect(brandArtwork({ logo: { src: "/images/branding/ecure-logo.webp", alt: "Other client" } }))
    .toEqual({ src: "/images/branding/ecure-logo.webp", official: false });
});

it("uses client photography only for known E-Cure defaults", () => {
  const original = { src: "/images/caregiver.jpg", alt: "Original photograph" };
  expect(clientPhoto("ecure", original, "about")).toEqual(ecurePhotography.landmark);
  expect(clientPhoto(undefined, original, "about")).toBe(original);
  const uploaded = { src: "/api/media/client-photo", alt: "Published client photograph" };
  expect(clientPhoto("ecure", uploaded, "about")).toBe(uploaded);
  expect(clientPhoto("ecure", { src: "/images/physiotherapy.jpg", alt: "Original" }, "physiotherapy"))
    .toEqual(ecurePhotography.physiotherapy);
  for (const [usage, source, expected] of [
    ["home", "/images/home-care.jpg", ecurePhotography.home],
    ["nursing-care", "/images/home-care.jpg", ecurePhotography.nursing],
    ["caretaker-services", "/images/caregiver.jpg", ecurePhotography.caretaker],
    ["medical-equipment", "/images/equipment.svg", ecurePhotography.equipment],
    ["online-consultation", "/images/consultation.svg", ecurePhotography.consultation],
    ["laboratory-services", "/images/laboratory.svg", ecurePhotography.laboratory],
  ] as const) {
    expect(clientPhoto("ecure", { src: source, alt: "Original" }, usage)).toEqual(expected);
    expect(clientPhoto(undefined, { src: source, alt: "Other client" }, usage)).toEqual({ src: source, alt: "Other client" });
    expect(clientPhoto("ecure", uploaded, usage)).toBe(uploaded);
  }
  expect(clientPhoto("ecure", uploaded, "new-service")).toBe(uploaded);
  expect(clientPhoto("ecure", uploaded, "constructor")).toBe(uploaded);
});
