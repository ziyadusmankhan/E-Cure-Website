import "server-only";
import { z } from "zod";
import { site } from "@/config/site";
import { ecureLegacyPhotoPaths } from "@/config/branding";
import { copyKeysFor, contentPages, type CmsDocument, type CmsBrand } from "@/types/cms";
const text = (max = 1000) => z.string().trim().min(1).max(max);
const list = z.array(text()).max(30);
export const slug = text(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const staticAssets = new Set(
  [
    site.logo.src,
    site.media.hero.src,
    site.media.about.src,
    ...(site.presentation === "ecure" ? ecureLegacyPhotoPaths : []),
    ...site.services.map((s) => s.image),
  ].filter(Boolean),
);
export const assetPath = z
  .string()
  .max(300)
  .refine(
    (value) =>
      staticAssets.has(value) ||
      (value.startsWith("/api/media/") && z.uuid().safeParse(value.slice(11)).success),
  );
export const mediaSchema = z
  .object({
    hero: z.object({ src: assetPath, alt: text(300) }).strict(),
    about: z.object({ src: assetPath, alt: text(300) }).strict(),
  })
  .strict();
const https = z.union([
  z.literal(""),
  z
    .url()
    .max(1000)
    .refine((value) => {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password;
    }),
]);
const contrast = (value: string) => {
  if (!value) return true;
  if (!/^#[a-fA-F0-9]{6}$/.test(value)) return false;
  const v = [1, 3, 5]
    .map((index) => parseInt(value.slice(index, index + 2), 16) / 255)
    .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
  return (0.93 + 0.05) / (v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722 + 0.05) >= 4.5;
};
const color = z.string().refine(contrast, "Choose a darker color for readable text.");
export const brandSchema = z
  .object({
    name: text(160),
    shortName: text(80),
    brandLine: text(100),
    tagline: text(300),
    description: text(1000),
    theme: z.enum(["clinical-blue", "soft-teal", "warm-neutral"]),
    logo: z.object({ src: z.union([z.literal(""), assetPath]), alt: text(160) }).strict(),
    contact: z
      .object({
        phone: z
          .string()
          .max(24)
          .refine((v) => !v || /^\+?[0-9\s()-]{7,24}$/.test(v)),
        secondaryPhone: z
          .string()
          .max(24)
          .refine((v) => !v || /^\+?[0-9\s()-]{7,24}$/.test(v))
          .optional(),
        email: z.union([z.literal(""), z.email().max(254)]),
        address: z.string().max(500),
        serviceArea: z.string().max(500),
        whatsappUrl: https,
        mapUrl: https,
      })
      .strict(),
    socialLinks: z
      .array(z.object({ label: text(80), url: https.refine((v) => !!v) }).strict())
      .max(10),
    primaryColor: color,
    secondaryColor: color,
    timezone: text(80).refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }),
  })
  .strict();
const item = z.object({ title: text(160), description: text(2000) }).strict();
const faq = z.object({ question: text(300), answer: text(3000) }).strict();
export const cmsServiceSchema = z
  .object({
    slug,
    title: text(160),
    shortTitle: text(100),
    label: text(300),
    description: text(1000),
    headline: text(300),
    overview: text(5000),
    icon: z
      .string()
      .max(80)
      .regex(/^[a-z-]+$/)
      .optional(),
    kind: z.enum(["care", "equipment"]).optional(),
    image: assetPath,
    imageAlt: text(300),
    includes: z.array(item).max(20),
    audience: list,
    expectation: text(3000),
    preparation: list,
    faqs: z.array(faq).max(30),
    related: z.array(slug).max(12),
    enabled: z.boolean(),
    order: z.number().int().min(0).max(10000),
  })
  .strict();
export const sectionsSchema = z
  .object(
    Object.fromEntries(Object.keys(site.sections).map((key) => [key, z.boolean()])) as Record<
      keyof typeof site.sections,
      z.ZodBoolean
    >,
  )
  .strict();
export const benefitsSchema = z
  .array(z.object({ title: text(160), text: text(2000) }).strict())
  .min(1)
  .max(20);
export const faqGroupsSchema = z
  .array(
    z
      .object({
        id: slug,
        title: text(160),
        description: text(1000),
        items: z.array(faq).min(1).max(30),
      })
      .strict(),
  )
  .min(1)
  .max(15);
export const revisionSchema = z.number().int().min(0).max(2147483646);
export const contentPatchSchema = z
  .object({
    revision: revisionSchema,
    page: z.enum(contentPages),
    copy: z.record(z.string(), text(5000)),
    media: mediaSchema.optional(),
    sections: sectionsSchema.optional(),
    benefits: benefitsSchema.optional(),
    steps: benefitsSchema.optional(),
    faqGroups: faqGroupsSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const allowed = new Set<string>(copyKeysFor(data.page, site.copy));
    if (
      Object.keys(data.copy).some((key) => !allowed.has(key)) ||
      (data.page !== "home" && (data.sections || data.benefits || data.steps)) ||
      (data.page !== "faq" && data.faqGroups) ||
      (data.media && !["home", "about"].includes(data.page))
    )
      ctx.addIssue({ code: "custom", message: "Unexpected content field." });
  });
export function initialDocument(): CmsDocument {
  const { name, shortName, brandLine, tagline, description, logo, contact, socialLinks, theme } =
    site;
  return structuredClone({
    brand: {
      name,
      shortName,
      brandLine,
      tagline,
      description,
      logo,
      contact,
      socialLinks,
      theme,
      primaryColor: "",
      secondaryColor: "",
      timezone: "Asia/Karachi",
    },
    copy: site.copy,
    media: site.media,
    sections: site.sections,
    benefits: site.benefits,
    steps: site.steps,
    faqGroups: site.faqGroups,
    services: site.services,
  });
}
export function validateDocument(doc: CmsDocument): CmsDocument {
  brandSchema.parse(doc.brand);
  mediaSchema.parse(doc.media);
  sectionsSchema.parse(doc.sections);
  benefitsSchema.parse(doc.benefits);
  benefitsSchema.parse(doc.steps);
  faqGroupsSchema.parse(doc.faqGroups);
  z.array(cmsServiceSchema).min(1).max(60).parse(doc.services);
  const keys = new Set(doc.services.map((s) => s.slug));
  if (
    keys.size !== doc.services.length ||
    !doc.services.some((s) => s.enabled) ||
    doc.services.some((s) => s.related.some((id) => !keys.has(id) || id === s.slug))
  )
    throw new Error("Invalid service catalog.");
  if (
    Object.keys(doc.copy).length !== Object.keys(site.copy).length ||
    Object.entries(doc.copy).some(
      ([k, v]) => !(k in site.copy) || typeof v !== "string" || !v.trim() || v.length > 5000,
    )
  )
    throw new Error("Invalid website wording.");
  return doc;
}
export type ValidBrand = z.infer<typeof brandSchema> & CmsBrand;
