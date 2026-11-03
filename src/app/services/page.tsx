import { WebsitePage } from "@/components/website-provider";
import { pageMetadata } from "@/config/metadata";
import { getPublicWebsite } from "@/server/cms/public";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ServiceCard } from "@/components/shared/service-card";
import { CTASection } from "@/components/shared/cta-section";
import { HandHeart } from "lucide-react";
export const metadata: Metadata = pageMetadata("services");
export default async function ServicesPage() {
  const snapshot = await getPublicWebsite();
  const { site, services } = snapshot;
  return (
    <WebsitePage value={snapshot}>
      <>
        <div className="page-intro">
          <div className="container">
            <Breadcrumbs items={[{ label: "All services" }]} />
            <div className="intro-row">
              <div>
                <span className="eyebrow">{site.copy.services_all_home_health_services_1}</span>
                <h1>
                  {site.copy.services_a_little_support_2}
                  <br />
                  {site.copy.services_a_world_of_difference_3}
                </h1>
                <p>{site.copy.services_every_care_journey_is_different_4}</p>
              </div>
              <HandHeart className="intro-icon" size={140} strokeWidth={0.7} aria-hidden="true" />
            </div>
          </div>
        </div>
        <section className="section">
          <div className="container">
            <div className="directory-heading">
              <h2>{site.copy.services_explore_your_care_options_5}</h2>
              <span>{String(services.length).padStart(2, "0")} service categories</span>
            </div>
            <div className="services-grid">
              {services.map((s, i) => (
                <ServiceCard service={s} index={i} key={s.slug} />
              ))}
            </div>
            <p className="directory-note">
              {site.copy.services_these_categories_describe_potential_care_7}
            </p>
          </div>
        </section>
        <CTASection />
      </>
    </WebsitePage>
  );
}
