export const appointmentStatuses = [
  "new",
  "contacted",
  "confirmed",
  "completed",
  "cancelled",
  "declined",
] as const;
export const inquiryStatuses = ["new", "read", "archived"] as const;
export type AppointmentState = (typeof appointmentStatuses)[number];
export const appointmentTransitions: Record<AppointmentState, readonly AppointmentState[]> = {
  new: ["contacted", "confirmed", "cancelled", "declined"],
  contacted: ["confirmed", "cancelled", "declined"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  declined: [],
};
export const staffLabel = (role: string, id: string) =>
  `${role === "owner" ? "Owner" : role === "receptionist" ? "Receptionist" : "Staff"} · ${id.slice(0, 6)}`;
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export type WorkflowDetail = {
  record: { id: string; version: number; status: string; assignedTo: string | null };
  history: {
    total: number;
    page: number;
    items: {
      id: string;
      kind: string;
      fromStatus: string | null;
      toStatus: string;
      assignedTo: string | null;
      note: string;
      actorId: string | null;
      createdAt: string;
    }[];
  };
  staff: { id: string; role: string }[];
  timezone?: string;
};
export type CustomerDetail = {
  record: { id: string; name: string; phone: string; email: string | null; version: number };
};
