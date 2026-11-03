import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Database, Transaction } from "../db/connection";
import { cmsState, mediaAssets, services, businessSettings, pages } from "../db/schema";
import { BackendError, operation } from "../errors";
import type { AdminIdentity } from "@/types/admin-auth";
import type { CmsDocument, CmsEditorState } from "@/types/cms";
import { site } from "@/config/site";
import {
  brandSchema,
  cmsServiceSchema,
  contentPatchSchema,
  initialDocument,
  revisionSchema,
  validateDocument,
} from "./validation";
import { guardActor, adminAudit } from "../admin/guard";
import { z } from "zod";

export async function initializeCms(db: Database) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(810008)`);
    const [business] = await tx.select().from(businessSettings).where(eq(businessSettings.id, 1));
    if (business?.profileId !== site.id) throw new BackendError("CONFIGURATION");
    const doc = initialDocument();
    doc.brand.name = business.name;
    doc.brand.theme = business.theme as CmsDocument["brand"]["theme"];
    doc.brand.timezone = business.timezone;
    doc.brand.contact.email = business.contactEmail || doc.brand.contact.email;
    doc.brand.contact.phone = business.phone || doc.brand.contact.phone;
    await tx.insert(cmsState).values({ id: 1, draft: doc, published: doc }).onConflictDoNothing();
  });
}
const dto = (row: typeof cmsState.$inferSelect): CmsEditorState => ({
  draft: row.draft,
  revision: row.revision,
  publishedRevision: row.publishedRevision,
  publishedAt: row.publishedAt?.toISOString() || null,
});
const mediaIds = (doc: CmsDocument) => [
  ...new Set(
    [
      doc.brand.logo.src,
      doc.media.hero.src,
      doc.media.about.src,
      ...doc.services.filter((s) => s.enabled).map((s) => s.image),
    ].flatMap((path) => (path.startsWith("/api/media/") ? [path.slice("/api/media/".length)] : [])),
  ),
];
export function cmsStore(db: Database, actor: AdminIdentity) {
  async function transaction<T>(
    work: (tx: Transaction, row: typeof cmsState.$inferSelect) => Promise<T>,
  ) {
    return operation(() =>
      db.transaction(async (tx) => {
        await guardActor(tx, actor, "content:manage");
        await tx.execute(
          sql`select set_config('lock_timeout','10000',true),set_config('statement_timeout','15000',true)`,
        );
        const [row] = await tx.select().from(cmsState).where(eq(cmsState.id, 1)).for("update");
        if (!row) throw new BackendError("CONFIGURATION");
        return work(tx, row);
      }),
    );
  }
  async function mutate(
    version: unknown,
    apply: (draft: CmsDocument) => void,
    entity: "service" | "page" | "publication" = "publication",
    id = "1",
  ) {
    const expected = revisionSchema.parse(version);
    return transaction(async (tx, row) => {
      if (row.revision !== expected) throw new BackendError("CONFLICT");
      const draft = structuredClone(row.draft);
      apply(draft);
      const [updated] = await tx
        .update(cmsState)
        .set({ draft, revision: row.revision + 1, updatedAt: new Date() })
        .where(eq(cmsState.id, 1))
        .returning();
      await adminAudit(tx, actor, "updated", entity, id);
      return dto(updated);
    });
  }
  return {
    read: () => transaction(async (_tx, row) => dto(row)),
    saveBrand: (input: unknown) => {
      const v = z.object({ revision: revisionSchema, brand: brandSchema }).strict().parse(input);
      return mutate(v.revision, (d) => {
        d.brand = v.brand;
      });
    },
    saveContent: (input: unknown) => {
      const v = contentPatchSchema.parse(input);
      return mutate(
        v.revision,
        (d) => {
          Object.assign(d.copy, v.copy);
          if (v.media) d.media = v.media;
          if (v.sections) d.sections = v.sections;
          if (v.benefits) d.benefits = v.benefits;
          if (v.steps) d.steps = v.steps;
          if (v.faqGroups) d.faqGroups = v.faqGroups;
        },
        "page",
        v.page,
      );
    },
    saveService: (input: unknown) => {
      const v = z
        .object({
          revision: revisionSchema,
          originalSlug: z.string().max(120).nullable(),
          service: cmsServiceSchema,
        })
        .strict()
        .parse(input);
      return mutate(
        v.revision,
        (d) => {
          const index = d.services.findIndex((s) => s.slug === v.originalSlug);
          if (v.originalSlug && index < 0) throw new BackendError("NOT_FOUND");
          if (d.services.some((s, i) => s.slug === v.service.slug && i !== index))
            throw new BackendError("CONFLICT");
          if (index < 0 && d.services.length >= 60) throw new BackendError("INVALID_INPUT");
          if (index < 0) d.services.push(v.service);
          else d.services[index] = v.service;
          if (v.originalSlug && v.originalSlug !== v.service.slug)
            for (const service of d.services)
              service.related = service.related
                .map((slug) => (slug === v.originalSlug ? v.service.slug : slug))
                .filter((slug) => slug !== service.slug);
        },
        "service",
        v.service.slug,
      );
    },
    archiveService: (input: unknown) => {
      const v = z
        .object({ revision: revisionSchema, slug: z.string().max(120) })
        .strict()
        .parse(input);
      return mutate(
        v.revision,
        (d) => {
          const s = d.services.find((s) => s.slug === v.slug);
          if (!s) throw new BackendError("NOT_FOUND");
          s.enabled = false;
        },
        "service",
        v.slug,
      );
    },
    removeService: (input: unknown) => {
      const v = z
        .object({ revision: revisionSchema, slug: z.string().max(120) })
        .strict()
        .parse(input);
      return mutate(
        v.revision,
        (d) => {
          if (!d.services.some((s) => s.slug === v.slug)) throw new BackendError("NOT_FOUND");
          d.services = d.services.filter((s) => s.slug !== v.slug);
          for (const s of d.services) s.related = s.related.filter((id) => id !== v.slug);
        },
        "service",
        v.slug,
      );
    },
    reorder: (input: unknown) => {
      const v = z
        .object({ revision: revisionSchema, slugs: z.array(z.string().max(120)).max(60) })
        .strict()
        .parse(input);
      return mutate(v.revision, (d) => {
        if (
          new Set(v.slugs).size !== d.services.length ||
          v.slugs.length !== d.services.length ||
          v.slugs.some((id) => !d.services.some((s) => s.slug === id))
        )
          throw new BackendError("INVALID_INPUT");
        d.services = d.services.map((s) => ({ ...s, order: v.slugs.indexOf(s.slug) }));
      });
    },
    discard: (input: unknown) => {
      const v = z.object({ revision: revisionSchema }).strict().parse(input);
      return transaction(async (tx, row) => {
        if (v.revision !== row.revision) throw new BackendError("CONFLICT");
        const next = row.revision + 1;
        const [updated] = await tx
          .update(cmsState)
          .set({
            draft: row.published,
            revision: next,
            publishedRevision: next,
            updatedAt: new Date(),
          })
          .where(eq(cmsState.id, 1))
          .returning();
        await adminAudit(tx, actor, "updated", "publication", "1");
        return dto(updated);
      });
    },
    publish: (input: unknown) => {
      const v = z.object({ revision: revisionSchema }).strict().parse(input);
      return transaction(async (tx, row) => {
        if (row.revision !== v.revision) throw new BackendError("CONFLICT");
        try {
          validateDocument(row.draft);
        } catch {
          throw new BackendError("PUBLICATION_INVALID");
        }
        const ids = mediaIds(row.draft);
        if (ids.length) {
          const found = await tx
            .select({ id: mediaAssets.id })
            .from(mediaAssets)
            .where(inArray(mediaAssets.id, ids));
          if (found.length !== ids.length) throw new BackendError("PUBLICATION_INVALID");
          await tx
            .update(mediaAssets)
            .set({ publishedAt: sql`coalesce(${mediaAssets.publishedAt},now())` })
            .where(inArray(mediaAssets.id, ids));
        }
        // Live catalog and public snapshot change in the same transaction. Drafts
        // never alter request eligibility or anonymous website responses.
        await tx.update(services).set({ enabled: false, published: false });
        for (const service of row.draft.services)
          await tx
            .insert(services)
            .values({
              slug: service.slug,
              title: service.title,
              description: service.description,
              content: [{ type: "paragraph", text: service.overview }],
              enabled: service.enabled,
              published: service.enabled,
              displayOrder: service.order,
            })
            .onConflictDoUpdate({
              target: services.slug,
              set: {
                title: service.title,
                description: service.description,
                content: [{ type: "paragraph" as const, text: service.overview }],
                enabled: service.enabled,
                published: service.enabled,
                displayOrder: service.order,
              },
            });
        await tx
          .update(businessSettings)
          .set({
            name: row.draft.brand.name,
            theme: row.draft.brand.theme,
            timezone: row.draft.brand.timezone,
            phone: row.draft.brand.contact.phone || null,
            contactEmail: row.draft.brand.contact.email || null,
          })
          .where(and(eq(businessSettings.id, 1), eq(businessSettings.profileId, site.id)));
        for (const key of ["home", "about", "services", "contact", "faq", "booking"]) {
          const prefix = key === "booking" ? "book_appointment_" : `${key}_`;
          const paragraphs = Object.entries(row.draft.copy)
            .filter(([k]) => k.startsWith(prefix))
            .map(([, text]) => ({ type: "paragraph" as const, text }));
          await tx
            .insert(pages)
            .values({
              slug: key,
              title:
                key === "home"
                  ? row.draft.brand.name
                  : site.seo.pages[key as keyof typeof site.seo.pages]?.title || key,
              description: row.draft.brand.description,
              content: paragraphs,
              published: true,
            })
            .onConflictDoUpdate({
              target: pages.slug,
              set: { content: paragraphs, published: true },
            });
        }
        const [updated] = await tx
          .update(cmsState)
          .set({
            published: row.draft,
            publishedRevision: row.revision,
            publishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(cmsState.id, 1))
          .returning();
        await adminAudit(tx, actor, "published", "publication", "1");
        return dto(updated);
      });
    },
  };
}
