export const themePresets = {
  "clinical-blue": {
    label: "Clinical Blue",
    primary: "#125e96",
    ink: "#16374a",
    accent: "#147c70",
    muted: "#5b6d78",
    canvas: "#f7f9f8",
    tint: "#ecf4ef",
    border: "#dbe4e5",
    deep: "#163e54",
  },
  "soft-teal": {
    label: "Soft Teal",
    primary: "#146c63",
    ink: "#153c38",
    accent: "#166c63",
    muted: "#526d65",
    canvas: "#f5f8f4",
    tint: "#eaf5ef",
    border: "#d4e2da",
    deep: "#194b42",
  },
  "warm-neutral": {
    label: "Warm Neutral",
    primary: "#6b5139",
    ink: "#3b342b",
    accent: "#526748",
    muted: "#6f655a",
    canvas: "#f8f5ef",
    tint: "#eeeade",
    border: "#ded8cf",
    deep: "#443c31",
  },
} as const;
export type ThemeName = keyof typeof themePresets;
export function getTheme(value?: string): ThemeName {
  return value && Object.hasOwn(themePresets, value) ? (value as ThemeName) : "clinical-blue";
}
