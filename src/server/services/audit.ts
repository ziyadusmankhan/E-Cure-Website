import "server-only";
import type { Executor } from "../db/connection";
import { auditEvents } from "../db/schema";

export function audit(
  tx: Executor,
  action: "created" | "updated" | "deleted" | "requested" | "seeded",
  entityType: "business" | "service" | "page" | "customer" | "appointment" | "inquiry",
  entityId: string,
) {
  return tx
    .insert(auditEvents)
    .values({ action, entityType, entityId, metadata: { source: "foundation" } });
}
