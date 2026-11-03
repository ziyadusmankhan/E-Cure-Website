import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { site } from "@/config/site";
import type { AdminIdentity, AdminPermission } from "@/types/admin-auth";
import { rolePermissions } from "@/types/admin-auth";
import { administrativeUsers, businessSettings, auditEvents } from "../db/schema";
import type { Executor } from "../db/connection";
import { BackendError } from "../errors";
export async function guardActor(tx: Executor, actor: AdminIdentity, permission: AdminPermission) {
  await tx.execute(sql`select pg_advisory_xact_lock_shared(710007)`);
  const [business] = await tx
    .select({ profile: businessSettings.profileId })
    .from(businessSettings)
    .where(eq(businessSettings.id, 1));
  const [staff] = await tx
    .select()
    .from(administrativeUsers)
    .where(and(eq(administrativeUsers.userId, actor.userId), eq(administrativeUsers.active, true)));
  if (business?.profile !== site.id) throw new BackendError("CONFIGURATION");
  if (
    !staff ||
    staff.roleKey !== actor.role ||
    staff.authIssuer !== actor.issuer ||
    Date.parse(actor.expiresAt) <= Date.now() ||
    !rolePermissions[actor.role].includes(permission)
  )
    throw new BackendError("FORBIDDEN");
}
export const adminAudit = (
  tx: Executor,
  actor: AdminIdentity,
  action: "created" | "updated" | "deleted" | "published",
  entityType: "appointment" | "inquiry" | "customer" | "publication" | "service" | "page" | "media",
  entityId: string,
) =>
  tx
    .insert(auditEvents)
    .values({
      actorId: actor.userId,
      action,
      entityType,
      entityId,
      metadata: { source: "administration" },
    });
