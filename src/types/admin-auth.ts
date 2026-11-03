export type AdminRole = "owner" | "receptionist";
export type AdminPermission = "workspace:read" | "access:read";
export const rolePermissions: Record<AdminRole, readonly AdminPermission[]> = {
  owner: ["workspace:read", "access:read"],
  receptionist: ["workspace:read"],
};
export type AdminIdentity = {
  userId: string;
  role: AdminRole;
  aal: "aal1" | "aal2";
  expiresAt: string;
};
