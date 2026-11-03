import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminPermission } from "@/types/admin-auth";
import { BackendError } from "../errors";
import { cookieName } from "./config";
import { authRuntime } from "./http";

// React cache is scoped to this server render, never a shared session cache.
export const currentAdmin = cache(async (permission?: AdminPermission, requireMfa = true) => {
  const { policy, store } = authRuntime();
  return store.authorize((await cookies()).get(cookieName(policy))?.value, permission, requireMfa);
});
export async function requireAdminPage(
  permission: AdminPermission = "workspace:read",
  next = "/admin",
  requireMfa = true,
) {
  try {
    return await currentAdmin(permission, requireMfa);
  } catch (error) {
    if (error instanceof BackendError) {
      if (error.code === "MFA_REQUIRED") redirect(`/admin/mfa?next=${encodeURIComponent(next)}`);
      if (error.code === "FORBIDDEN") redirect("/admin?denied=1");
      if (error.code === "UNAUTHENTICATED")
        redirect(`/admin/login?next=${encodeURIComponent(next)}`);
    }
    redirect("/admin/login?error=unavailable");
  }
}
