import type { Metadata } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppContact } from "@/components/shared/whatsapp-contact";
import { getPublicWebsite } from "@/server/cms/public";
import { WebsiteProvider } from "@/components/website-provider";
import { DraftBanner } from "@/components/admin/draft-banner";
import "./globals.css";

// Database publications and verified draft previews are resolved for each request.
export const dynamic = "force-dynamic";
const lora = Lora({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-body", display: "swap" });
export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getPublicWebsite();
  return {
    title: { default: `${site.name} — ${site.seo.homeTitle}`, template: `%s | ${site.name}` },
    description: site.description,
    ...(site.url ? { metadataBase: new URL(site.url) } : {}),
    openGraph: {
      title: site.name,
      description: site.description,
      type: "website",
      locale: site.seo.locale,
    },
    robots: { index: !site.demo, follow: !site.demo },
  };
}
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const snapshot = await getPublicWebsite();
  const { site, colors } = snapshot;
  return (
    <html
      lang="en"
      data-profile={site.id}
      data-theme={snapshot.theme}
      className={`${lora.variable} ${sourceSans.variable}`}
      style={
        {
          ...(colors.primary ? { "--blue": colors.primary } : {}),
          ...(colors.secondary ? { "--green": colors.secondary } : {}),
        } as React.CSSProperties
      }
    >
      <body>
        <WebsiteProvider value={snapshot}>
          <DraftBanner />
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
          <WhatsAppContact />
        </WebsiteProvider>
      </body>
    </html>
  );
}
