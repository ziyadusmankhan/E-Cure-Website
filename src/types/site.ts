export type SiteConfig = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  logo: { src: string; alt: string };
  contact: {
    phone: string;
    secondaryPhone?: string;
    email: string;
    address: string;
    serviceArea: string;
    whatsappUrl: string;
    mapUrl: string;
  };
  socialLinks: { label: string; url: string }[];
  url: string;
  showTestimonials: boolean;
  demo: boolean;
};
