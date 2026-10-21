import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ServiceCard } from "@/components/shared/service-card";
import { CTASection } from "@/components/shared/cta-section";
import { services } from "@/data/services";
import { HandHeart } from "lucide-react";
export const metadata: Metadata = {
  title: "All home health services",
  description:
    "Explore six home healthcare categories, including nursing, physiotherapy, caretaker support, equipment, laboratory services, and online consultation.",
};
export default function ServicesPage() {
  return (
    <>
      <div className="page-intro">
        <div className="container">
          <Breadcrumbs items={[{ label: "All services" }]} />
          <div className="intro-row">
            <div>
              <span className="eyebrow">ALL HOME HEALTH SERVICES</span>
              <h1>
                A little support.
                <br />A world of difference.
              </h1>
              <p>
                Every care journey is different. Get to know the options and find a starting point
                that makes sense for you and your family.
              </p>
            </div>
            <HandHeart className="intro-icon" size={140} strokeWidth={0.7} aria-hidden="true" />
          </div>
        </div>
      </div>
      <section className="section">
        <div className="container">
          <div className="directory-heading">
            <h2>Explore your care options</h2>
            <span>06 service categories</span>
          </div>
          <div className="services-grid">
            {services.map((s, i) => (
              <ServiceCard service={s} index={i} key={s.slug} />
            ))}
          </div>
          <p className="directory-note">
            These categories describe potential care options. Locations, professionals, service
            scope, and availability will be confirmed before a real service can be arranged.
          </p>
        </div>
      </section>
      <CTASection />
    </>
  );
}
