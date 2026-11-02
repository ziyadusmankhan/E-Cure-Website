import { pageMetadata } from "@/config/metadata";
import { site } from "@/config/site";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HandHeart, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BookingForm } from "@/components/forms/booking-form";
import Link from "next/link";
import { submissionPageConfig } from "@/server/submissions/config";
export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata("booking");
export default async function BookingPage() {
  if (!site.features.booking) notFound();
  const submissions = await submissionPageConfig();
  return (
    <div className="booking-page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Request an appointment" }]} />
        <div className="booking-layout">
          <aside className="booking-aside">
            <span className="eyebrow">{site.copy.book_appointment_a_little_closer_to_care_1}</span>
            <h1>
              {site.copy.book_appointment_lets_find_your_2}
              <br />
              {site.copy.book_appointment_next_step_3}
            </h1>
            <p>{site.copy.book_appointment_a_few_simple_details_are_4}</p>
            <div className="booking-aside-art">
              <HandHeart size={100} strokeWidth={0.8} />
              <span>{site.copy.book_appointment_care_starts_with_listening_5}</span>
            </div>
            <div className="demo-info">
              <ShieldCheck size={22} strokeWidth={1.5} />
              <div>
                <h2>{site.copy.book_appointment_a_safe_space_to_explore_6}</h2>
                <p>
                  {submissions.enabled
                    ? submissions.localTest
                      ? site.copy.submission_local_notice
                      : site.copy.submission_live_notice
                    : site.copy.book_appointment_this_is_a_frontend_demonstration_7}
                </p>
                <Link href="/privacy-policy">
                  {site.copy.book_appointment_read_the_provisional_privacy_notice_8}
                </Link>
              </div>
            </div>
          </aside>
          <Suspense
            fallback={
              <p className="form-loading" role="status">
                {site.copy.book_appointment_preparing_the_request_form_9}
              </p>
            }
          >
            <BookingForm submissions={submissions} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
