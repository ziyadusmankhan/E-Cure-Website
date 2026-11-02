import type { SiteConfig } from "@/types/site";
export const site: SiteConfig = {
  name: "Home Health Services",
  shortName: "Home Health",
  tagline: "Care, in familiar surroundings.",
  description:
    "Explore home healthcare options, from nursing and physiotherapy to everyday support. A frontend demonstration of a more thoughtful care experience.",
  logo: { src: "", alt: "Home Health Services" },
  contact: { phone: "", email: "", address: "", serviceArea: "", whatsappUrl: "", mapUrl: "" },
  socialLinks: [] as { label: string; url: string }[],
  url: process.env.NEXT_PUBLIC_SITE_URL || "",
  showTestimonials: true,
  demo: true,
};
