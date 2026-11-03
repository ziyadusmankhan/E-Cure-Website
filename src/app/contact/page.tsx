import { WebsitePage } from "@/components/website-provider";
import { pageMetadata } from "@/config/metadata";
import { getPublicWebsite } from "@/server/cms/public";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ContactDetails } from "@/components/shared/contact-details";
import { ContactForm } from "@/components/forms/contact-form";
import { submissionPageConfig } from "@/server/submissions/config";
export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata("contact");
export default async function ContactPage() {
  const snapshot = await getPublicWebsite();
  const { site } = snapshot;
  const submissions = await submissionPageConfig();
  return (
    <WebsitePage value={snapshot}>
      <>
        <div className="page-intro">
          <div className="container">
            <Breadcrumbs items={[{ label: "Contact" }]} />
            <span className="eyebrow">{site.copy.contact_lets_start_with_a_conversation_1}</span>
            <h1>
              {site.copy.contact_a_question_is_2}
              <br />
              {site.copy.contact_a_good_place_to_begin_3}
            </h1>
            <p>{site.copy.contact_whether_youre_exploring_options_for_4}</p>
          </div>
        </div>
        <section className="section">
          <div className="container contact-page-grid">
            <div>
              <h2>{site.copy.contact_ways_to_connect_5}</h2>
              <p className="muted">{site.copy.contact_real_contact_details_and_service_6}</p>
              <ContactDetails />
              <div className="contact-booking">
                <span className="eyebrow">{site.copy.contact_already_have_a_service_in_7}</span>
                <h3>{site.copy.contact_try_the_appointment_experience_8}</h3>
                <Link className="text-link" href="/book-appointment">
                  {site.copy.contact_request_an_appointment_9}
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
            {site.features.inquiryForm ? (
              <ContactForm submissions={submissions} />
            ) : (
              <div className="expect-panel">
                <p>{site.copy.inquiry_disabled}</p>
              </div>
            )}
          </div>
        </section>
      </>
    </WebsitePage>
  );
}
