import { z } from "zod";
import { services } from "@/data/services";
export function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const name = z
  .string()
  .trim()
  .min(2, "Please enter at least two characters.")
  .max(80, "Please keep the name under 80 characters.");
const email = z.union([z.literal(""), z.email("Please enter a valid email address.")]);
export const bookingSchema = z.object({
  service: z
    .string()
    .refine((value) => services.some((s) => s.slug === value), "Please choose a service."),
  name,
  phone: z
    .string()
    .trim()
    .regex(/^[+\d()\s-]+$/, "Use digits and standard phone punctuation.")
    .refine((value) => {
      const n = value.replace(/\D/g, "").length;
      return n >= 7 && n <= 15;
    }, "Please enter a phone number with 7–15 digits."),
  email,
  date: z.string().refine((value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      value >= localToday()
    );
  }, "Please choose today or a future date."),
  time: z.enum(
    ["Morning (9am–12pm)", "Afternoon (12pm–4pm)", "Evening (4pm–7pm)", "No preference"],
    { error: "Please choose a preferred time window." },
  ),
  inquiry: z.string().trim().max(500, "Please keep your inquiry under 500 characters."),
});
export type BookingValues = z.infer<typeof bookingSchema>;
export const inquirySchema = z.object({
  name,
  email: z.email("Please enter a valid email address."),
  topic: z.string().min(1, "Please choose a topic."),
  message: z
    .string()
    .trim()
    .min(10, "Please enter at least 10 characters.")
    .max(500, "Please keep your message under 500 characters."),
});
export type InquiryValues = z.infer<typeof inquirySchema>;
