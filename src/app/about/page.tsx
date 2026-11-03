import { WebsitePage } from "@/components/website-provider";
import { pageMetadata } from "@/config/metadata";
import { getPublicWebsite } from "@/server/cms/public";
import type { Metadata } from "next";
import Image from "next/image";
import { HeartHandshake, House, MessagesSquare } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SectionHeading } from "@/components/shared/section-heading";
import { CTASection } from "@/components/shared/cta-section";
export const metadata: Metadata = pageMetadata("about");
export default async function AboutPage() {
  const snapshot = await getPublicWebsite();
  const { site } = snapshot;
  return (
    <WebsitePage value={snapshot}>
      <>
        <div className="page-intro">
          <div className="container">
            <Breadcrumbs items={[{ label: "About" }]} />
            <span className="eyebrow">{site.copy.about_the_idea_behind_home_care_2}</span>
            <h1>
              {site.copy.about_care_belongs_in_3}
              <br />
              {site.copy.about_the_story_of_everyday_life_4}
            </h1>
            <p>{site.copy.about_people_have_routines_favourite_places_5}</p>
          </div>
        </div>
        <section className="section">
          <div className="container editorial-grid">
            <div className="about-image">
              <Image
                src={site.media.about.src}
                unoptimized={site.media.about.src.startsWith("/api/admin/media/")}
                alt={site.media.about.alt}
                fill
                sizes="(max-width: 760px) 100vw, 45vw"
              />
            </div>
            <div className="editorial-copy">
              <SectionHeading
                eyebrow={site.copy.about_our_proposed_approach_7}
                title={site.copy.about_see_the_person_understand_the_8}
              />
              <p>{site.copy.about_this_website_introduces_a_possible_9}</p>
              <p>{site.copy.about_home_care_is_not_onesizefitsall_10}</p>
            </div>
          </div>
        </section>
        <section className="values-section section">
          <div className="container">
            <SectionHeading
              eyebrow={site.copy.about_principles_that_guide_the_experience_11}
              title={site.copy.about_simple_ideas_thoughtfully_considered_12}
            />
            <div className="inclusion-grid">
              {[
                {
                  icon: HeartHandshake,
                  title: site.copy.about_respect_for_the_individual_13,
                  text: site.copy.about_make_room_for_personal_preferences_14,
                },
                {
                  icon: MessagesSquare,
                  title: site.copy.about_clear_conversations_15,
                  text: site.copy.about_understand_what_a_service_involves_16,
                },
                {
                  icon: House,
                  title: site.copy.about_care_in_context_17,
                  text: site.copy.about_consider_the_home_environment_daily_18,
                },
              ].map((v) => (
                <article key={v.title}>
                  <v.icon size={32} strokeWidth={1.3} />
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section">
          <div className="container company-details">
            <SectionHeading
              eyebrow={site.copy.about_a_note_about_this_demonstration_19}
              title={site.copy.about_a_foundation_for_a_real_20}
              description={site.copy.about_the_final_company_identity_and_21}
            />
            <dl>
              {[
                {
                  title: site.copy.about_our_story_mission_22,
                  text: site.copy.about_the_companys_history_and_approved_23,
                },
                {
                  title: site.copy.about_the_people_behind_the_care_24,
                  text: site.copy.about_verified_team_profiles_and_relevant_25,
                },
                {
                  title: site.copy.about_our_service_locations_26,
                  text: site.copy.about_confirmed_areas_and_local_arrangements_27,
                },
                {
                  title: site.copy.about_professional_credentials_28,
                  text: site.copy.about_applicable_registrations_and_independently_verified_29,
                },
              ].map((d) => (
                <div key={d.title}>
                  <dt>{d.title}</dt>
                  <dd>{d.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <CTASection />
      </>
    </WebsitePage>
  );
}
