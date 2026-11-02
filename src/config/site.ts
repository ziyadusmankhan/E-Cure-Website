import { getProfile } from "./profiles";
import { validateProfile } from "./profile-utils";
const selected = getProfile(process.env.NEXT_PUBLIC_SITE_PROFILE || "default");
export const site = validateProfile({
  ...selected,
  url: process.env.NEXT_PUBLIC_SITE_URL || selected.url,
});
