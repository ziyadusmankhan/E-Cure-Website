import { site } from "@/config/site";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, ArrowRight } from "lucide-react";
import { services, getService } from "@/data/services";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SectionHeading } from "@/components/shared/section-heading";
import { ServiceCard } from "@/components/shared/service-card";
import { ServiceIcon } from "@/components/shared/service-icon";
import { CTASection } from "@/components/shared/cta-section";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/components/ui/accordion";
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  return {
    title: service?.title || "Service not found",
    description: service?.description,
    openGraph: { title: service?.title, description: service?.description },
  };
}
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  return (
    <>
      <section className={`service-hero ${service.kind === "equipment" ? "equipment-hero" : ""}`}>
        <div className="container">
          <Breadcrumbs
            items={[{ label: "Services", href: "/services" }, { label: service.title }]}
          />
          <div className="service-hero-grid">
            <div>
              <span className="eyebrow">
                <ServiceIcon slug={slug} size={19} />
                {service.title}
              </span>
              <h1>{service.headline}</h1>
              <p>{service.overview}</p>
              <Button asChild>
                <Link
                  href={site.features.booking ? `/book-appointment?service=${slug}` : "/contact"}
                >
                  {site.copy.service_request} <ArrowUpRight size={18} />
                </Link>
              </Button>
              <span className="service-availability">{site.copy.service_availability}</span>
            </div>
            <figure
              className={`service-hero-image ${service.image.endsWith("svg") ? "is-illustration" : ""}`}
            >
              <Image
                src={service.image}
                alt={service.imageAlt}
                fill
                priority
                sizes="(max-width: 760px) 100vw, 46vw"
              />
              <figcaption>{service.label}</figcaption>
            </figure>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow={
              service.kind === "equipment"
                ? site.copy.service_equipment_eyebrow
                : site.copy.service_includes_eyebrow
            }
            title={
              service.kind === "equipment"
                ? site.copy.service_equipment_title
                : site.copy.service_includes_title
            }
          />
          <div className="inclusion-grid">
            {service.includes.map((item, i) => (
              <article key={item.title}>
                <span className="inclusion-number">0{i + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {service.kind === "equipment" && (
                  <span className="category-note">{site.copy.service_equipment_note}</span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="service-expect section">
        <div className="container two-column">
          <div>
            <SectionHeading
              eyebrow={site.copy.service_audience_eyebrow}
              title={site.copy.service_audience_title}
            />
            <ul className="check-list">
              {service.audience.map((item) => (
                <li key={item}>
                  <Check size={19} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="expect-panel">
            <span className="eyebrow">{site.copy.service_expect_eyebrow}</span>
            <h2>{site.copy.service_expect_title}</h2>
            <p>{service.expectation}</p>
            <h3>{site.copy.service_prepare_title}</h3>
            <ul>
              {service.preparation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container service-request-row">
          <div>
            <span className="eyebrow">{site.copy.service_process_eyebrow}</span>
            <h2>
              {site.copy.service_process_title} {service.shortTitle.toLowerCase()}
            </h2>
          </div>
          <ol className="request-steps">
            <li>
              <span>01</span>
              {site.copy.service_step_one} <ArrowRight size={16} />
            </li>
            <li>
              <span>02</span>
              {site.copy.service_step_two} <ArrowRight size={16} />
            </li>
            <li>
              <span>03</span>
              {site.copy.service_step_three}
            </li>
          </ol>
          <p className="small muted">
            In a live service, a team member would discuss the details before confirming care. No
            request is sent by this demo.
          </p>
        </div>
      </section>
      {site.features.serviceFAQs && (
        <section className="faq-section section">
          <div className="container faq-grid">
            <SectionHeading
              eyebrow={site.copy.service_faq_eyebrow}
              title={site.copy.service_faq_title}
            />
            <FAQ items={service.faqs} />
          </div>
        </section>
      )}
      {site.features.relatedServices && service.related.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHeading
              eyebrow={site.copy.service_related_eyebrow}
              title={site.copy.service_related_title}
            />
            <div className="related-grid">
              {service.related.map((related, i) => {
                const item = getService(related);
                return item ? <ServiceCard service={item} index={i} key={related} /> : null;
              })}
            </div>
          </div>
        </section>
      )}
      <CTASection service={slug} />
    </>
  );
}
