import type { MetadataRoute } from "next";
import { ecureCanonicalOrigin, site } from "@/config/site";
import { publicPaths } from "@/config/profile-utils";
import { isIndexableRequest } from "@/server/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!ecureCanonicalOrigin || !(await isIndexableRequest())) return [];

  return publicPaths(site).map((path) => ({ url: new URL(path, ecureCanonicalOrigin).href }));
}
