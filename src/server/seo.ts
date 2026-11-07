import "server-only";
import { headers } from "next/headers";
import { ecureCanonicalOrigin } from "@/config/site";

export async function isIndexableRequest() {
  const vercelEnvironment = process.env.VERCEL_ENV;
  if (
    process.env.SITE_INDEXING_ENABLED !== "true" ||
    !ecureCanonicalOrigin ||
    (vercelEnvironment && vercelEnvironment !== "production")
  ) {
    return false;
  }

  const host = (await headers()).get("host");
  return host?.toLowerCase() === new URL(ecureCanonicalOrigin).host;
}
