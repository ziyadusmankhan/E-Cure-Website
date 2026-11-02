import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowDown, House, HandHeart, Heart, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import { ServiceCard } from "@/components/shared/service-card";
import { CTASection } from "@/components/shared/cta-section";
import { ContactDetails } from "@/components/shared/contact-details";
import { services } from "@/data/services";
import { benefits, steps } from "@/data/site-content";
import { site } from "@/config/site";
import { FAQ } from "@/components/ui/accordion";
import { homepageFAQs } from "@/data/faqs";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" />
              {site.copy.home_care_that_feels_closer_1}
            </span>
            <h1>
              {site.copy.home_compassionate_2}
              <br className="desktop-break" />
              {site.copy.home_healthcare_3}
              <br />
              <em>{site.copy.home_closer_to_home_4}</em>
            </h1>
            <p>{site.copy.home_for_the_everyday_moments_for_5}</p>
            <div className="hero-actions">
              <Button asChild>
                <Link href="/services">
                  {site.copy.home_explore_our_services_6}
                  <ArrowUpRight size={18} />
                </Link>
              </Button>
              <Link
                href={site.features.booking ? "/book-appointment" : "/contact"}
                className="text-link"
              >
                {site.copy.home_request_an_appointment_7}
                <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="hero-note">
              <HandHeart size={23} strokeWidth={1.4} aria-hidden="true" />
              <span>
                {site.copy.home_for_you_for_your_family_8}
                <br />
                <strong>{site.copy.home_for_the_place_you_call_9}</strong>
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div
              className={`hero-image ${site.media.hero.src.endsWith("svg") ? "is-illustration" : ""}`}
            >
              <Image
                src={site.media.hero.src}
                alt={site.media.hero.alt}
                fill
                priority
                sizes="(max-width: 760px) 100vw, 52vw"
              />
            </div>
            <div className="image-caption">
              <span className="caption-icon">
                <House size={23} strokeWidth={1.5} />
              </span>
              <div>
                <strong>
                  {site.copy.home_familiar_surroundings_11}
                  <br />
                  {site.copy.home_a_more_personal_care_experience_12}
                </strong>
                <span>{site.copy.home_discover_the_possibilities_of_home_13}</span>
              </div>
            </div>
            <span className="photo-note">{site.copy.home_care_imagery_for_illustration_14}</span>
          </div>
        </div>
        <div className="container hero-foot">
          <span>{site.copy.home_clinical_care_everyday_support_one_15}</span>
          <a
            href={site.sections.services ? "#services" : "/services"}
            aria-label="Discover our services"
          >
            <ArrowDown size={18} />
          </a>
        </div>
      </section>
      {site.sections.services && (
        <section className="services-section section" id="services">
          <div className="container">
            <div className="section-top">
              <SectionHeading
                eyebrow={site.copy.home_our_services_16}
                title={site.copy.home_different_needs_thoughtful_care_17}
                description={site.copy.home_from_professional_care_to_everyday_18}
              />
              <span className="section-aside">
                {site.copy.home_support_for_life_19}
                <br />
                {site.copy.home_at_home_20}
              </span>
            </div>
            <div className="services-grid">
              {services.map((service, i) => (
                <ServiceCard service={service} index={i} key={service.slug} />
              ))}
            </div>
            <div className="section-bottom">
              <p>{site.copy.home_not_sure_where_to_start_21}</p>
              <Link className="text-link" href="/services">
                {site.copy.home_view_all_home_health_services_22}
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}
      {site.sections.about && (
        <section className="about-preview section" id="about">
          <div className="container editorial-grid">
            <div className="about-image">
              <Image
                src={site.media.about.src}
                alt={site.media.about.alt}
                fill
                sizes="(max-width: 760px) 100vw, 45vw"
              />
              <div className="image-label">
                <Heart size={18} strokeWidth={1.5} />
                <span>{site.copy.home_care_starts_with_understanding_24}</span>
              </div>
            </div>
            <div className="editorial-copy">
              <SectionHeading
                eyebrow={site.copy.home_a_more_personal_approach_25}
                title={site.copy.home_home_is_more_than_a_26}
              />
              <p>{site.copy.home_care_should_consider_the_person_27}</p>
              <p>{site.copy.home_whether_youre_considering_help_for_28}</p>
              <Link href="/about" className="text-link">
                {site.copy.home_get_to_know_home_healthcare_29}
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}
      {site.sections.whyHomeCare && (
        <section className="why-section section" id="why-home-care">
          <div className="container why-grid">
            <div>
              <SectionHeading
                eyebrow={site.copy.home_why_home_healthcare_30}
                title={site.copy.home_familiar_places_meaningful_possibilities_31}
              />
              <p className="why-intro">{site.copy.home_the_right_care_arrangement_is_32}</p>
              <div className="why-illustration" aria-hidden="true">
                <House strokeWidth={0.7} />
                <span>{site.copy.home_here_life_feels_familiar_33}</span>
              </div>
            </div>
            <div className="benefits-list">
              {benefits.map((benefit, i) => (
                <article key={benefit.title}>
                  <span>
                    {site.copy.home_0_34}
                    {i + 1}
                  </span>
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.text}</p>
                  </div>
                </article>
              ))}
              <p className="small muted">
                {site.copy.home_suitability_and_service_arrangements_depend_35}
              </p>
            </div>
          </div>
        </section>
      )}
      {site.sections.howItWorks && (
        <section className="process-section section" id="how-it-works">
          <div className="container">
            <SectionHeading
              eyebrow={site.copy.home_a_clearer_way_forward_36}
              title={site.copy.home_from_a_question_to_a_37}
              description={site.copy.home_a_simple_introduction_to_how_38}
            />
            <div className="steps-grid">
              {steps.map((step, i) => (
                <article key={step.title}>
                  <div className="step-number">
                    {site.copy.home_0_39}
                    {i + 1}
                    <span />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
            <p className="demo-inline">
              <span />
              {site.copy.home_try_the_journey_this_demo_40}
            </p>
          </div>
        </section>
      )}
      {site.showTestimonials && site.sections.testimonials && (
        <section className="testimonial-section" aria-labelledby="testimonials-heading">
          <div className="container testimonial-inner">
            <Quote size={42} strokeWidth={1} aria-hidden="true" />
            <div>
              <span className="eyebrow">{site.copy.home_patient_family_voices_41}</span>
              <h2 id="testimonials-heading">{site.copy.home_a_space_for_real_experiences_42}</h2>
              <p>{site.copy.home_care_stories_deserve_to_be_43}</p>
            </div>
            <span className="outline-label">{site.copy.home_demonstration_placeholder_44}</span>
          </div>
        </section>
      )}
      {site.sections.questions && (
        <section className="faq-section section" id="questions">
          <div className="container faq-grid">
            <div>
              <SectionHeading
                eyebrow={site.copy.home_helpful_to_know_45}
                title={site.copy.home_a_few_questions_answered_46}
                description={site.copy.home_understand_your_options_before_taking_47}
              />
              <Link href="/faq" className="text-link homepage-faq-link">
                {site.copy.home_read_all_frequently_asked_questions_48}
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <FAQ items={homepageFAQs} />
          </div>
        </section>
      )}
      {site.sections.cta && <CTASection />}
      {site.sections.contact && (
        <section className="contact-preview section" id="contact">
          <div className="container contact-preview-grid">
            <div>
              <SectionHeading
                eyebrow={site.copy.home_start_a_conversation_49}
                title={site.copy.home_lets_talk_about_what_you_50}
              />
              <p>{site.copy.home_explore_your_options_ask_a_51}</p>
              <Link className="text-link" href="/contact">
                {site.copy.home_visit_our_contact_page_52}
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <ContactDetails />
          </div>
        </section>
      )}
    </>
  );
}
