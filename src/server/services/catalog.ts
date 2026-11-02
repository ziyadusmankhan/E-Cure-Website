import "server-only";
import { and, asc, eq } from "drizzle-orm";
import type { Database } from "../db/connection";
import { businessSettings, pages, services } from "../db/schema";
import { BackendError, operation } from "../errors";
import { idSchema, pageSchema, serviceSchema, settingsSchema, slugSchema } from "../validation";
import { audit } from "./audit";

// Trusted internal foundation API. No HTTP/Server Action exports. Phase 7 must
// establish verified sessions/permissions before administrative callers are added.
export function catalogService(db: Database) {
  return {
    getSettings: () =>
      operation(async () => (await db.select().from(businessSettings).limit(1))[0] ?? null),
    saveSettings: (input: unknown) =>
      operation(async () => {
        const values = settingsSchema.parse(input);
        return db.transaction(async (tx) => {
          const [row] = await tx
            .insert(businessSettings)
            .values(values)
            .onConflictDoUpdate({ target: businessSettings.id, set: values })
            .returning();
          await audit(tx, "updated", "business", "1");
          return row;
        });
      }),
    // Explicit public projection: no private/customer fields or unpublished rows.
    listPublishedServices: () =>
      operation(() =>
        db
          .select({
            id: services.id,
            slug: services.slug,
            title: services.title,
            description: services.description,
            content: services.content,
          })
          .from(services)
          .where(and(eq(services.enabled, true), eq(services.published, true)))
          .orderBy(asc(services.displayOrder), asc(services.slug)),
      ),
    createService: (input: unknown) =>
      operation(async () => {
        const values = serviceSchema.parse(input);
        return db.transaction(async (tx) => {
          const [row] = await tx.insert(services).values(values).returning();
          await audit(tx, "created", "service", row.id);
          return row;
        });
      }),
    replaceService: (id: string, input: unknown) =>
      operation(async () => {
        idSchema.parse(id);
        const values = serviceSchema.parse(input);
        return db.transaction(async (tx) => {
          const [row] = await tx
            .update(services)
            .set(values)
            .where(eq(services.id, id))
            .returning();
          if (!row) throw new BackendError("NOT_FOUND");
          await audit(tx, "updated", "service", row.id);
          return row;
        });
      }),
    deleteService: (id: string) =>
      operation(async () => {
        idSchema.parse(id);
        return db.transaction(async (tx) => {
          const [row] = await tx
            .delete(services)
            .where(eq(services.id, id))
            .returning({ id: services.id });
          if (!row) throw new BackendError("NOT_FOUND");
          await audit(tx, "deleted", "service", id);
          return row;
        });
      }),
    createPage: (input: unknown) =>
      operation(async () => {
        const values = pageSchema.parse(input);
        return db.transaction(async (tx) => {
          const [row] = await tx.insert(pages).values(values).returning();
          await audit(tx, "created", "page", row.id);
          return row;
        });
      }),
    getPublishedPage: (slug: string) =>
      operation(async () => {
        slugSchema.parse(slug);
        return (
          (
            await db
              .select({
                slug: pages.slug,
                title: pages.title,
                description: pages.description,
                content: pages.content,
              })
              .from(pages)
              .where(and(eq(pages.slug, slug), eq(pages.published, true)))
              .limit(1)
          )[0] ?? null
        );
      }),
    replacePage: (id: string, input: unknown) =>
      operation(async () => {
        idSchema.parse(id);
        const values = pageSchema.parse(input);
        return db.transaction(async (tx) => {
          const [row] = await tx.update(pages).set(values).where(eq(pages.id, id)).returning();
          if (!row) throw new BackendError("NOT_FOUND");
          await audit(tx, "updated", "page", id);
          return row;
        });
      }),
    deletePage: (id: string) =>
      operation(async () => {
        idSchema.parse(id);
        return db.transaction(async (tx) => {
          const [row] = await tx.delete(pages).where(eq(pages.id, id)).returning({ id: pages.id });
          if (!row) throw new BackendError("NOT_FOUND");
          await audit(tx, "deleted", "page", id);
          return row;
        });
      }),
  };
}
