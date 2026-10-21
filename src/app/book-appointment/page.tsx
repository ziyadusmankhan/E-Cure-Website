import type { Metadata } from "next";
import { Suspense } from "react";
import { HandHeart, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BookingForm } from "@/components/forms/booking-form";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Request an appointment — demo",
  description:
    "Try a three-step appointment request demonstration. Choose a service, review example details, and explore the care arrangement experience.",
};
export default function BookingPage() {
  return (
    <div className="booking-page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Request an appointment" }]} />
        <div className="booking-layout">
          <aside className="booking-aside">
            <span className="eyebrow">A LITTLE CLOSER TO CARE</span>
            <h1>
              Let’s find your
              <br />
              next step.
            </h1>
            <p>A few simple details are a starting point for a more personal conversation.</p>
            <div className="booking-aside-art">
              <HandHeart size={100} strokeWidth={0.8} />
              <span>Care starts with listening.</span>
            </div>
            <div className="demo-info">
              <ShieldCheck size={22} strokeWidth={1.5} />
              <div>
                <h2>A safe space to explore</h2>
                <p>
                  This is a frontend demonstration. Please use example details. Nothing you enter is
                  sent or saved by the form.
                </p>
                <Link href="/privacy-policy">Read the provisional privacy notice</Link>
              </div>
            </div>
          </aside>
          <Suspense
            fallback={
              <p className="form-loading" role="status">
                Preparing the request form…
              </p>
            }
          >
            <BookingForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
