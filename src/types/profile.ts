import type { SiteConfig } from "@/types/site";
import type { Service } from "@/types/service";
import type { PublicCopy } from "@/config/content/default-copy";
import type { ThemeName } from "@/config/themes";
import type { FAQGroup } from "@/data/faq-catalog";
export type SectionKey =
  | "about"
  | "services"
  | "whyHomeCare"
  | "howItWorks"
  | "testimonials"
  | "questions"
  | "contact"
  | "cta";
export type SectionFlags = Record<SectionKey, boolean>;
export type NavLink = { label: string; href: string; section?: SectionKey };
export type PageKey = "about" | "services" | "contact" | "booking" | "faq" | "privacy";
export type ServiceEntry = Service & { enabled: boolean; order: number };
export type PublicProfile = SiteConfig & {
  id: string;
  /** Frontend-only presentation; independent of the persisted CMS theme. */
  presentation?: "ecure";
  businessType: "home-healthcare" | "general-clinic" | "physiotherapy";
  brandLine: string;
  fixture: boolean;
  theme: ThemeName;
  copy: PublicCopy;
  sections: SectionFlags;
  features: {
    whatsapp: boolean;
    inquiryForm: boolean;
    booking: boolean;
    serviceFAQs: boolean;
    relatedServices: boolean;
  };
  navigation: {
    main: NavLink[];
    footer: NavLink[];
    servicesLabel: string;
    allServicesLabel: string;
  };
  media: { hero: { src: string; alt: string }; about: { src: string; alt: string } };
  benefits: { title: string; text: string }[];
  steps: { title: string; text: string }[];
  faqGroups: FAQGroup[];
  services: ServiceEntry[];
  seo: {
    homeTitle: string;
    locale: string;
    pages: Record<PageKey, { title: string; description: string }>;
  };
};
