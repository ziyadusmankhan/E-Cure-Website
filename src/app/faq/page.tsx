import { WebsitePage } from "@/components/website-provider";
import { pageMetadata } from "@/config/metadata";
import { getPublicWebsite } from "@/server/cms/public";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CTASection } from "@/components/shared/cta-section";
import { SectionHeading } from "@/components/shared/section-heading";
import { FAQ } from "@/components/ui/accordion";

export const metadata: Metadata = pageMetadata("faq");

export default async function FAQPage() {
  const snapshot = await getPublicWebsite();
  const { site, services } = snapshot;
  const faqGroups = site.faqGroups;
  return (
    <WebsitePage value={snapshot}>
      <>
        <div className="page-intro">
          <div className="container">
            <Breadcrumbs items={[{ label: "Frequently asked questions" }]} />
            <span className="eyebrow">{site.copy.faq_helpful_to_know_1}</span>
            <h1>
              {site.copy.faq_a_little_clarity_2}
              <br />
              {site.copy.faq_a_more_confident_next_step_3}
            </h1>
            <p>{site.copy.faq_explore_the_questions_people_may_4}</p>
          </div>
        </div>
        <section className="section">
          <div className="container faq-page-layout">
            <aside className="faq-index">
              <h2>{site.copy.faq_find_your_answer_5}</h2>
              <nav aria-label="Question topics">
                {faqGroups.map((group) => (
                  <Link href={`#${group.id}`} key={group.id}>
                    {group.title}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                ))}
              </nav>
              <p>{site.copy.faq_have_a_question_about_one_6}</p>
              <Link href="/services" className="text-link">
                {site.copy.faq_explore_care_options_7}
                <ArrowUpRight size={16} />
              </Link>
            </aside>
            <div className="faq-groups">
              {faqGroups.map((group) => (
                <section id={group.id} className="faq-group" key={group.id}>
                  <SectionHeading
                    eyebrow={site.copy.faq_your_questions_8}
                    title={group.title}
                    description={group.description}
                  />
                  <FAQ items={group.items} />
                </section>
              ))}
            </div>
          </div>
        </section>
        <section className="service-expect section">
          <div className="container">
            <SectionHeading
              eyebrow={site.copy.faq_explore_a_little_further_9}
              title={site.copy.faq_questions_about_a_specific_service_10}
              description={site.copy.faq_each_service_page_has_its_11}
            />
            <div className="faq-service-links">
              {services.map((service) => (
                <Link href={`/services/${service.slug}`} key={service.slug}>
                  {service.title}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              ))}
            </div>
            <div className="faq-help-note">
              <p>{site.copy.faq_for_a_general_inquiry_explore_12}</p>
              <Link href="/contact" className="text-link">
                {site.copy.faq_contact_options_13}
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </section>
        <CTASection />
      </>
    </WebsitePage>
  );
}
