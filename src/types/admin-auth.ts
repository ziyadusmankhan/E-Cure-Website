export type AdminRole = "owner" | "receptionist";
export type AdminPermission =
  | "workspace:read"
  | "access:read"
  | "appointments:manage"
  | "customers:manage"
  | "inquiries:manage"
  | "content:manage"
  | "exports:read";
export const rolePermissions: Record<AdminRole, readonly AdminPermission[]> = {
  owner: [
    "workspace:read",
    "access:read",
    "appointments:manage",
    "customers:manage",
    "inquiries:manage",
    "content:manage",
    "exports:read",
  ],
  receptionist: ["workspace:read", "appointments:manage", "customers:manage", "inquiries:manage"],
};
export type AdminIdentity = {
  userId: string;
  issuer: string;
  role: AdminRole;
  aal: "aal1" | "aal2";
  expiresAt: string;
};
