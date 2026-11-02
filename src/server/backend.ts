import "server-only";
import { eq } from "drizzle-orm";
import { site } from "@/config/site";
import { getDatabase, type Database } from "./db/connection";
import { businessSettings } from "./db/schema";
import { BackendError, operation } from "./errors";
import { catalogService } from "./services/catalog";
import { requestService } from "./services/requests";

// Internal entry point for later route/auth layers. Identity must match the
// configured deployment; accidentally reusing another client's DB fails closed.
export function backendForDeployment(db: Database, profileId: string) {
  return operation(async () => {
    const [business] = await db
      .select({ profileId: businessSettings.profileId })
      .from(businessSettings)
      .where(eq(businessSettings.id, 1));
    if (!business || business.profileId !== profileId) throw new BackendError("CONFIGURATION");
    return { catalog: catalogService(db), requests: requestService(db) };
  });
}
export function getBackend() {
  return backendForDeployment(getDatabase(), site.id);
}
