import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { site as base } from "@/config/site";
import { activeServices } from "@/config/profile-utils";
import { getTheme } from "@/config/themes";
import type { CmsDocument, WebsiteSnapshot } from "@/types/cms";
import { cmsState, businessSettings } from "../db/schema";
import { getDatabase, type Database } from "../db/connection";
import { BackendError } from "../errors";
export const cmsEnabled = () => process.env.CMS_MODE === "database";
export function snapshotFor(doc: CmsDocument, revision: number, preview = false): WebsiteSnapshot {
  const enabled = doc.services.filter((service) => service.enabled);
  const slugs = new Set(enabled.map((service) => service.slug));
  const draftAsset = (path: string) =>
    preview && path.startsWith("/api/media/")
      ? path.replace("/api/media/", "/api/admin/media/")
      : path;
  const profile = {
    ...base,
    ...doc.brand,
    logo: { ...doc.brand.logo, src: draftAsset(doc.brand.logo.src) },
    copy: doc.copy,
    media: {
      hero: { ...doc.media.hero, src: draftAsset(doc.media.hero.src) },
      about: { ...doc.media.about, src: draftAsset(doc.media.about.src) },
    },
    sections: doc.sections,
    benefits: doc.benefits,
    steps: doc.steps,
    faqGroups: doc.faqGroups,
    services: enabled.map((s) => ({
      ...s,
      related: s.related.filter((id) => slugs.has(id) && id !== s.slug),
      image: draftAsset(s.image),
    })),
  };
  return {
    site: profile,
    services: activeServices(profile),
    preview,
    revision,
    theme: profile.theme,
    colors: { primary: doc.brand.primaryColor, secondary: doc.brand.secondaryColor },
  };
}
export async function readPublishedWebsite(
  db: Database,
  profileId = base.id,
): Promise<WebsiteSnapshot> {
  const [business] = await db
    .select({ id: businessSettings.profileId })
    .from(businessSettings)
    .where(eq(businessSettings.id, 1));
  if (business?.id !== profileId) throw new BackendError("CONFIGURATION");
  const [row] = await db
    .select({ document: cmsState.published, revision: cmsState.publishedRevision })
    .from(cmsState)
    .where(eq(cmsState.id, 1));
  if (!row) throw new BackendError("CONFIGURATION");
  return snapshotFor(row.document, row.revision);
}
export const getPublicWebsite = cache(async (): Promise<WebsiteSnapshot> => {
  if (!cmsEnabled())
    return {
      site: base,
      services: activeServices(base),
      preview: false,
      revision: 0,
      theme: getTheme(process.env.SITE_THEME || base.theme),
      colors: { primary: "", secondary: "" },
    };
  await connection();
  const db = getDatabase();
  const published = await readPublishedWebsite(db);
  if ((await cookies()).get("healthcare-cms-preview")?.value === "1") {
    try {
      const { currentAdmin } = await import("../auth/pages");
      await currentAdmin("content:manage");
      const [row] = await db
        .select({ draft: cmsState.draft, revision: cmsState.revision })
        .from(cmsState)
        .where(eq(cmsState.id, 1));
      if (row) return snapshotFor(row.draft, row.revision, true);
    } catch {
      /* Unverified or expired preview sessions see published data only. */
    }
  }
  return published;
});
