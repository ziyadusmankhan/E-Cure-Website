import { site } from "@/config/site";
export type { FAQGroup } from "./faq-catalog";
export const faqGroups = site.faqGroups;
export const homepageFAQs = site.faqGroups.flatMap((group) => group.items).slice(0, 3);
