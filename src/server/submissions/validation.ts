import "server-only";
import { z } from "zod";
import { timeWindows, visitModes, inquiryTopics, businessToday } from "@/lib/submission-values";
import { BackendError } from "../errors";

const name = z.string().trim().min(2).max(80);
const email = z
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
const securityFields = {
  consent: z.literal(true),
  website: z.string().max(200).default(""),
  turnstileToken: z.string().min(1).max(2048),
};
export const publicAppointmentSchema = z
  .object({
    service: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name,
    phone: z
      .string()
      .trim()
      .max(40)
      .transform((v) => v.replace(/[\s()-]/g, ""))
      .pipe(z.string().regex(/^\+?[0-9]{7,15}$/)),
    email: z.union([z.literal(""), email]).default(""),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((s) => {
        const d = new Date(`${s}T00:00:00Z`);
        return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === s;
      }),
    time: z.enum(timeWindows),
    visitMode: z.enum(visitModes),
    inquiry: z.string().trim().max(500).default(""),
    ...securityFields,
  })
  .strict();
export const publicInquirySchema = z
  .object({
    name,
    email,
    topic: z.enum(inquiryTopics),
    message: z.string().trim().min(10).max(500),
    ...securityFields,
  })
  .strict();
export type AppointmentSubmission = z.infer<typeof publicAppointmentSchema>;
export type InquirySubmission = z.infer<typeof publicInquirySchema>;
export function validatePreferredDate(
  date: string,
  time: string,
  timezone: string,
  now = new Date(),
) {
  const today = businessToday(timezone, now);
  const max = businessToday(timezone, new Date(now.valueOf() + 365 * 86400000));
  if (date < today || date > max) throw new BackendError("INVALID_DATE");
  if (date === today) {
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        hourCycle: "h23",
      }).format(now),
    );
    const end = [12, 16, 19][timeWindows.indexOf(time as (typeof timeWindows)[number])];
    if (end && hour >= end) throw new BackendError("INVALID_DATE");
  }
}
