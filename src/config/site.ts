import { getProfile } from "./profiles";
import { validateProfile } from "./profile-utils";
import { ecureSiteUrl } from "./branding";
const selected = getProfile(process.env.NEXT_PUBLIC_SITE_PROFILE || "default");
export const site = validateProfile({
  ...selected,
  url: process.env.NEXT_PUBLIC_SITE_URL || selected.url,
});

export const ecureCanonicalOrigin =
  site.presentation === "ecure" && site.url.replace(/\/$/, "") === ecureSiteUrl
    ? ecureSiteUrl
    : undefined;
