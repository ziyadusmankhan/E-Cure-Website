import type { Metadata } from "next";
import type { PageKey } from "@/types/profile";
import { site } from "./site";
export function pageMetadata(key: PageKey): Metadata {
  const page = site.seo.pages[key];
  return { ...page, openGraph: { title: page.title, description: page.description } };
}
