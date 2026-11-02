import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CTASection } from "@/components/shared/cta-section";
import { SectionHeading } from "@/components/shared/section-heading";
import { FAQ } from "@/components/ui/accordion";
import { faqGroups } from "@/data/faqs";
import { services } from "@/data/services";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Understand home care options, appointment requests, service availability, and how this healthcare website demonstration handles your information.",
};

export default function FAQPage() {
  return (
    <>
      <div className="page-intro">
        <div className="container">
          <Breadcrumbs items={[{ label: "Frequently asked questions" }]} />
          <span className="eyebrow">HELPFUL TO KNOW</span>
          <h1>
            A little clarity.
            <br />A more confident next step.
          </h1>
          <p>
            Explore the questions people may have when considering care at home, and understand what
            this demonstration can do.
          </p>
        </div>
      </div>
      <section className="section">
        <div className="container faq-page-layout">
          <aside className="faq-index">
            <h2>Find your answer</h2>
            <nav aria-label="Question topics">
              {faqGroups.map((group) => (
                <Link href={`#${group.id}`} key={group.id}>
                  {group.title}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </nav>
            <p>Have a question about one particular service?</p>
            <Link href="/services" className="text-link">
              Explore care options <ArrowUpRight size={16} />
            </Link>
          </aside>
          <div className="faq-groups">
            {faqGroups.map((group) => (
              <section id={group.id} className="faq-group" key={group.id}>
                <SectionHeading
                  eyebrow="YOUR QUESTIONS"
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
            eyebrow="EXPLORE A LITTLE FURTHER"
            title="Questions about a specific service?"
            description="Each service page has its own preparation notes, practical information, and helpful answers."
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
            <p>
              For a general inquiry, explore the contact page. Please use fictional details
              throughout this demo.
            </p>
            <Link href="/contact" className="text-link">
              Contact options <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <CTASection />
    </>
  );
}
