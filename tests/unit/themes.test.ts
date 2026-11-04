import { expect, it } from "vitest";
import { getTheme, themePresets } from "@/config/themes";
function luminance(hex: string) {
  const channels = hex
    .replace("#", "")
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
for (const [name, theme] of Object.entries(themePresets)) {
  it(`${name} has readable text and action contrast`, () => {
    for (const surface of ["#ffffff", theme.canvas, theme.tint])
      for (const text of [theme.ink, theme.muted, theme.primary, theme.accent])
        expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.primary, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
}
it("rejects arbitrary theme names", () => {
  expect(getTheme("unknown")).toBe("clinical-blue");
});
