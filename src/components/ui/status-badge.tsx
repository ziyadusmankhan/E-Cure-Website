export const requestStatuses = [
  "New",
  "Contacted",
  "Confirmed",
  "Completed",
  "Cancelled",
  "Declined",
] as const;
export type RequestStatus = (typeof requestStatuses)[number];
export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>;
}
