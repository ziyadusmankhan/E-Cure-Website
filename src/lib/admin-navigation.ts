export const adminDestinations = [
  "/admin",
  "/admin/access",
  "/admin/appointments",
  "/admin/customers",
  "/admin/inquiries",
  "/admin/website",
] as const;
export function safeAdminNext(value: unknown): string {
  return typeof value === "string" && adminDestinations.some((path) => path === value)
    ? value
    : "/admin";
}
export function isAdminNavigation(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value === "/admin/login" ||
      adminDestinations.some(
        (path) => path === value || value === `/admin/mfa?next=${encodeURIComponent(path)}`,
      ))
  );
}
