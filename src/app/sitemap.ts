import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { publicPaths } from "@/config/profile-utils";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.url || site.demo) return [];
  return publicPaths(site).map(path=>({url:new URL(path,site.url).href}));
}
