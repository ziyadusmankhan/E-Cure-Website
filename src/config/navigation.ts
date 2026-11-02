import { site } from "./site";
import { visibleLinks } from "./profile-utils";
export const mainNavigation = visibleLinks(site.navigation.main, site);
export const footerNavigation = visibleLinks(site.navigation.footer, site);
