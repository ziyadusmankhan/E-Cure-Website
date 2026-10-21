import type { Metadata } from "next";
import { Lora, Source_Sans_3 } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppContact } from "@/components/shared/whatsapp-contact";
import { site } from "@/config/site";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-body", display: "swap" });
export const metadata: Metadata = {
  title: { default: `${site.name} — Care, closer to home`, template: `%s | ${site.name}` },
  description: site.description,
  ...(site.url ? { metadataBase: new URL(site.url) } : {}),
  openGraph: { title: site.name, description: site.description, type: "website", locale: "en_US" },
  robots: { index: !site.demo, follow: !site.demo },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lora.variable} ${sourceSans.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <WhatsAppContact />
      </body>
    </html>
  );
}
