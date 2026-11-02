import "server-only";
import { z } from "zod";

export const idSchema = z.uuid();
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const title = z.string().trim().min(1).max(160);
const email = z
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
export const contentSchema = z
  .array(
    z.discriminatedUnion("type", [
      z
        .object({
          type: z.literal("paragraph"),
          heading: title.optional(),
          text: z.string().trim().min(1).max(10000),
        })
        .strict(),
      z
        .object({
          type: z.literal("bullets"),
          heading: title.optional(),
          items: z.array(z.string().trim().min(1).max(1000)).min(1).max(30),
        })
        .strict(),
    ]),
  )
  .max(40);
export const serviceSchema = z
  .object({
    slug: slugSchema,
    title,
    description: z.string().trim().min(1).max(1000),
    content: contentSchema.default([]),
    enabled: z.boolean().default(false),
    published: z.boolean().default(false),
    displayOrder: z.number().int().min(0).max(10000).default(0),
  })
  .strict();
export const pageSchema = z
  .object({
    slug: slugSchema,
    title,
    description: z.string().trim().min(1).max(1000),
    content: contentSchema.default([]),
    published: z.boolean().default(false),
  })
  .strict();
export const settingsSchema = z
  .object({
    profileId: z.string().trim().min(1).max(80),
    name: title,
    businessType: z.enum(["home-healthcare", "general-clinic", "physiotherapy"]),
    timezone: z
      .string()
      .max(80)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }),
    theme: z.enum(["clinical-blue", "soft-teal", "warm-neutral"]),
    contactEmail: email.nullable().default(null),
    phone: z.string().max(24).nullable().default(null),
  })
  .strict();
export const customerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .trim()
      .max(40)
      .transform((value) => value.replace(/[\s()-]/g, ""))
      .pipe(z.string().regex(/^\+?[0-9]{7,15}$/)),
    email: email.nullable().default(null),
  })
  .strict();
const validDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.valueOf()) &&
      date.toISOString().slice(0, 10) === value &&
      value >= "2000-01-01" &&
      value <= "2100-12-31"
    );
  });
export const appointmentSchema = z
  .object({
    customer: customerSchema,
    serviceId: idSchema,
    visitMode: z.enum(["home", "clinic", "online"]),
    preferredDate: validDate,
    timeWindow: z.string().trim().min(1).max(80),
    consent: z.literal(true),
  })
  .strict();
export const inquirySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email,
    subject: title,
    message: z.string().trim().min(10).max(2000),
  })
  .strict();
export const inquiryStatusSchema = z.enum(["new", "read", "archived"]);
