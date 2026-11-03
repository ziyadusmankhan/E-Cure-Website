"use client";
import { useWebsite } from "@/components/website-provider";
import Link from "next/link";
import { ArrowUpRight, HousePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
export function CTASection({ service }: { service?: string }) {
  const { site } = useWebsite();
  if (!site.sections.cta) return null;
  return (
    <section className="cta-section">
      <div className="container cta-inner">
        <div>
          <span className="eyebrow">{site.copy.shared_cta_section_lets_find_your_next_step_1}</span>
          <h2>{site.copy.shared_cta_section_looking_for_care_at_home_2}</h2>
          <p>{site.copy.shared_cta_section_explore_the_options_and_share_3}</p>
        </div>
        <div className="cta-actions">
          <Button asChild variant="light">
            <Link
              href={
                !site.features.booking
                  ? "/contact"
                  : service
                    ? `/book-appointment?service=${service}`
                    : "/book-appointment"
              }
            >
              {site.copy.shared_cta_section_request_an_appointment_4}
              <ArrowUpRight size={18} />
            </Link>
          </Button>
          <Link className="light-link" href="/services">
            {site.copy.shared_cta_section_explore_all_services_5}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <HousePlus className="cta-watermark" size={250} strokeWidth={0.5} aria-hidden="true" />
      </div>
    </section>
  );
}
