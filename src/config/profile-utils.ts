import type { PublicProfile, NavLink } from "@/types/profile";
import type { Service } from "@/types/service";
export function publicPaths(profile: PublicProfile) {
  return [
    "/",
    "/about",
    "/services",
    "/contact",
    "/faq",
    "/privacy-policy",
    ...(profile.features.booking ? ["/book-appointment"] : []),
    ...activeServices(profile).map((service) => `/services/${service.slug}`),
  ];
}
export function activeServices(profile: PublicProfile): Service[] {
  const entries = profile.services.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const slugs = new Set(entries.map((s) => s.slug));
  return entries.map((s) => ({
    ...s,
    related: s.related.filter((slug) => slugs.has(slug) && slug !== s.slug),
  }));
}
export function visibleLinks(links: NavLink[], profile: PublicProfile) {
  return links.filter(
    (link) =>
      (!link.section || profile.sections[link.section]) &&
      (link.href !== "/book-appointment" || profile.features.booking),
  );
}
export function contactPhones(contact: PublicProfile["contact"]) {
  const phones = [contact.phone, contact.secondaryPhone].filter(
    (phone): phone is string => Boolean(phone),
  );
  return [...new Map(phones.map((phone) => ["tel:" + phone.replace(/[^\d+]/g, ""), phone]))];
}
export function validateProfile(profile: PublicProfile) {
  if (profile.logo.src && !profile.logo.src.startsWith("/images/"))
    throw new Error("Logo must be a local image path.");
  if (profile.fixture && !profile.demo)
    throw new Error("Fictional profiles must remain demonstrations.");
  if (!profile.name.trim() || !profile.brandLine.trim())
    throw new Error("Profile needs a name and brand line.");
  if (!profile.services.some((s) => s.enabled))
    throw new Error("Profile must enable at least one service.");
  const slugs = profile.services.map((s) => s.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error("Duplicate service slugs in profile.");
  for (const service of profile.services) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(service.slug)) throw new Error("Invalid service slug.");
    if (!service.title.trim() || !service.image.startsWith("/images/"))
      throw new Error("Service needs a title and local image.");
    if (service.related.some((slug) => !slugs.includes(slug)))
      throw new Error("Related service must belong to this profile.");
  }
  for (const url of [
    profile.url,
    profile.contact.whatsappUrl,
    profile.contact.mapUrl,
    ...profile.socialLinks.map((link) => link.url),
  ]) {
    if (url && !/^https?:\/\//.test(url)) throw new Error("Profile URLs must use HTTP(S).");
    if (url) new URL(url);
  }
  return profile;
}
