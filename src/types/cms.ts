import type { PublicProfile, ServiceEntry } from "./profile";
export type CmsBrand = Pick<
  PublicProfile,
  | "name"
  | "shortName"
  | "brandLine"
  | "tagline"
  | "description"
  | "logo"
  | "contact"
  | "socialLinks"
  | "theme"
> & { primaryColor: string; secondaryColor: string; timezone: string };
export type CmsDocument = {
  brand: CmsBrand;
  copy: PublicProfile["copy"];
  media: PublicProfile["media"];
  sections: PublicProfile["sections"];
  benefits: PublicProfile["benefits"];
  steps: PublicProfile["steps"];
  faqGroups: PublicProfile["faqGroups"];
  services: ServiceEntry[];
};
export type WebsiteSnapshot = {
  site: PublicProfile;
  services: import("./service").Service[];
  preview: boolean;
  revision: number;
  theme: PublicProfile["theme"];
  colors: { primary: string; secondary: string };
};
export type CmsEditorState = {
  draft: CmsDocument;
  revision: number;
  publishedRevision: number;
  publishedAt: string | null;
};
export const contentPages = [
  "home",
  "about",
  "services",
  "contact",
  "faq",
  "booking",
  "shared",
] as const;
export type ContentPage = (typeof contentPages)[number];
export const pageCopyPrefix: Record<ContentPage, string[]> = {
  home: ["home_"],
  about: ["about_"],
  services: ["services_", "service_"],
  contact: ["contact_"],
  faq: ["faq_"],
  booking: ["book_appointment_"],
  shared: ["layout_header_", "layout_footer_", "shared_"],
};
export const copyKeysFor = <T extends Record<string, string>>(page: ContentPage, copy: T) =>
  (Object.keys(copy) as (keyof T & string)[]).filter((key) =>
    pageCopyPrefix[page].some((prefix) => key.startsWith(prefix)),
  );
