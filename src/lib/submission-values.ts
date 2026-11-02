export const timeWindows = [
  "Morning (9am–12pm)",
  "Afternoon (12pm–4pm)",
  "Evening (4pm–7pm)",
  "No preference",
] as const;
export const visitModes = ["home", "clinic", "online"] as const;
export const inquiryTopics = ["care-options", "service-areas", "appointments", "other"] as const;
export function businessToday(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
