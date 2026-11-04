import type { CSSProperties } from "react";
import type { PublicProfile } from "@/types/profile";

// Presentation-only client presets. Persisted CMS theme names stay independent.
export const clientThemes = {
  ecure: {
    "--blue": "#075A9E",
    "--green": "#247D29",
    "--ink": "#0B325F",
    "--deep": "#0B325F",
    "--body-text": "#34465A",
    "--muted": "#526579",
    "--paper": "#F4F8FB",
    "--mint": "#EDF6F0",
    "--line": "#DFE7ED",
    "--control-border": "#75899D",
    "--brand-accent": "#329B32",
    "--brand-blue-light": "#1376B9",
  },
} as const;

export const presentationTokenNames = Object.keys(clientThemes.ecure);
type PresentationStyle = CSSProperties & Partial<Record<`--${string}`, string>>;

export function presentationStyle(
  presentation: PublicProfile["presentation"],
  colors: { primary: string; secondary: string },
): PresentationStyle {
  return {
    ...(presentation ? clientThemes[presentation] : {}),
    ...(colors.primary ? { "--blue": colors.primary } : {}),
    ...(colors.secondary ? { "--green": colors.secondary } : {}),
  };
}
