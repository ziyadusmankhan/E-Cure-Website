import type { MetadataRoute } from "next";
import { site } from "@/config/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", ...(site.demo ? { disallow: "/" } : { allow: "/" }) },
    ...(!site.demo && site.url ? { sitemap: `${site.url}/sitemap.xml` } : {}),
  };
}
