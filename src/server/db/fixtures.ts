import "server-only";
import { getProfile } from "@/config/profiles";
import { sql } from "drizzle-orm";
import { businessSettings, pages, services, auditEvents } from "./schema";
import type { Database } from "./connection";

// Explicit, idempotent, insert-only fixtures: never overwrite reviewed content.
// No staff account, real customer or appointment is seeded.
export async function seedDemoProfile(db: Database, id: string) {
  const profile = getProfile(id);
  if (!profile.demo) throw new Error("Only demo profiles may be seeded.");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(510006)`);
    const [existing] = await tx
      .select({ profileId: businessSettings.profileId })
      .from(businessSettings)
      .limit(1);
    if (existing && existing.profileId !== id)
      throw new Error("Database already belongs to another profile.");
    await tx
      .insert(businessSettings)
      .values({
        profileId: id,
        name: profile.name,
        businessType: profile.businessType,
        timezone: "Asia/Karachi",
        theme: profile.theme,
        contactEmail: profile.contact.email || null,
      })
      .onConflictDoNothing();
    await tx
      .insert(services)
      .values(
        profile.services.map((service) => ({
          slug: service.slug,
          title: service.title,
          description: service.description,
          content: [{ type: "paragraph" as const, text: service.overview }],
          enabled: service.enabled,
          published: service.enabled,
          displayOrder: service.order,
        })),
      )
      .onConflictDoNothing({ target: services.slug });
    await tx
      .insert(pages)
      .values(
        Object.entries(profile.seo.pages).map(([key, page]) => ({
          slug: key,
          title: page.title,
          description: page.description,
          content: [{ type: "paragraph" as const, text: page.description }],
          published: false,
        })),
      )
      .onConflictDoNothing({ target: pages.slug });
    if (!existing)
      await tx.insert(auditEvents).values({
        action: "seeded",
        entityType: "business",
        entityId: "1",
        metadata: { source: "fixture" },
      });
    return { profile: id, services: profile.services.filter((service) => service.enabled).length };
  });
}
