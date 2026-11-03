import type { Metadata } from "next";
import { getPublicWebsite } from "@/server/cms/public";
import { WebsitePage } from "@/components/website-provider";
export const metadata: Metadata = {
  title: "Staff access",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <WebsitePage value={await getPublicWebsite()}>
      <section className="admin-area" aria-label="Staff administration">
        {children}
      </section>
    </WebsitePage>
  );
}
