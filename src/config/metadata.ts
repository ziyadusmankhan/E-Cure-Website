import type { Metadata } from "next";
import type { PageKey } from "@/types/profile";
import { ecureCanonicalOrigin, site } from "./site";

const publicPagePaths: Record<Exclude<PageKey, "booking">, string> = {
  about: "/about",
  services: "/services",
  contact: "/contact",
  faq: "/faq",
  privacy: "/privacy-policy",
};

export function canonicalMetadata(path: string): Metadata {
  return ecureCanonicalOrigin
    ? { alternates: { canonical: new URL(path, ecureCanonicalOrigin).href } }
    : {};
}

export function pageMetadata(key: PageKey): Metadata {
  const page = site.seo.pages[key];
  return {
    ...page,
    ...(key === "booking" ? {} : canonicalMetadata(publicPagePaths[key])),
    openGraph: { title: page.title, description: page.description },
  };
}
