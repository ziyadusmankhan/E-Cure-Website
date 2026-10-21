import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { services } from "@/data/services";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.url || site.demo) return [];
  return [
    "",
    "/about",
    "/services",
    "/book-appointment",
    "/contact",
    "/privacy-policy",
    ...services.map((s) => `/services/${s.slug}`),
  ].map((path) => ({ url: `${site.url}${path}` }));
}
