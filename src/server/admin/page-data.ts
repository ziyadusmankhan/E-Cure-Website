import "server-only";
import { notFound } from "next/navigation";
import { requireAdminPage } from "../auth/pages";
import { getDatabase } from "../db/connection";
import { operationsStore } from "./operations";
import type { AdminPermission } from "@/types/admin-auth";
import { BackendError } from "../errors";
export async function pageOperations(permission: AdminPermission, path: string) {
  const { principal } = await requireAdminPage(permission, path);
  return { principal, ops: operationsStore(getDatabase(), principal) };
}
export async function recordOr404<T>(work: () => Promise<T>) {
  try {
    return await work();
  } catch (e) {
    if (e instanceof BackendError && ["NOT_FOUND", "INVALID_INPUT", "FORBIDDEN"].includes(e.code))
      notFound();
    throw e;
  }
}
