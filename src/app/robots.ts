import type { MetadataRoute } from "next";
import { ecureCanonicalOrigin } from "@/config/site";
import { isIndexableRequest } from "@/server/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!ecureCanonicalOrigin || !(await isIndexableRequest())) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${ecureCanonicalOrigin}/sitemap.xml`,
  };
}
