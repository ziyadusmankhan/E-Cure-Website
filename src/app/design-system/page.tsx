import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Showcase } from "@/components/design-system/showcase";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Design system review",
  robots: { index: false, follow: false },
};
export default function DesignSystemPage() {
  if (process.env.ENABLE_DESIGN_SYSTEM !== "true") notFound();
  return <Showcase />;
}
