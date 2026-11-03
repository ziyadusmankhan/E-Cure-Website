import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Staff access",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="admin-area" aria-label="Staff administration">
      {children}
    </section>
  );
}
