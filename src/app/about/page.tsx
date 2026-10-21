import type { Metadata } from "next";
import Image from "next/image";
import { HeartHandshake, House, MessagesSquare } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SectionHeading } from "@/components/shared/section-heading";
import { CTASection } from "@/components/shared/cta-section";
export const metadata: Metadata = {
  title: "About home healthcare",
  description:
    "Understand the purpose and possibilities of thoughtful home healthcare for individuals and their families.",
};
export default function AboutPage() {
  return (
    <>
      <div className="page-intro">
        <div className="container">
          <Breadcrumbs items={[{ label: "About" }]} />
          <span className="eyebrow">THE IDEA BEHIND HOME CARE</span>
          <h1>
            Care belongs in
            <br />
            the story of everyday life.
          </h1>
          <p>
            People have routines, favourite places, and ways of doing things. A thoughtful care
            experience starts by recognising all of them.
          </p>
        </div>
      </div>
      <section className="section">
        <div className="container editorial-grid">
          <div className="about-image">
            <Image
              src="/images/home-care.jpg"
              alt="An older man and a companion sharing a book at home"
              fill
              sizes="(max-width: 760px) 100vw, 45vw"
            />
          </div>
          <div className="editorial-copy">
            <SectionHeading
              eyebrow="OUR PROPOSED APPROACH"
              title="See the person. Understand the need."
            />
            <p>
              This website introduces a possible home healthcare service built around clear
              information and considered care arrangements. It brings clinical services and everyday
              assistance into one easy-to-explore starting point.
            </p>
            <p>
              Home care is not one-size-fits-all. What is appropriate depends on a person’s needs,
              professional assessment where required, and the services available in their location.
            </p>
          </div>
        </div>
      </section>
      <section className="values-section section">
        <div className="container">
          <SectionHeading
            eyebrow="PRINCIPLES THAT GUIDE THE EXPERIENCE"
            title="Simple ideas. Thoughtfully considered."
          />
          <div className="inclusion-grid">
            {[
              {
                icon: HeartHandshake,
                title: "Respect for the individual",
                text: "Make room for personal preferences, dignity, and the person's involvement in care decisions.",
              },
              {
                icon: MessagesSquare,
                title: "Clear conversations",
                text: "Understand what a service involves, who provides it, and what needs to be agreed before it begins.",
              },
              {
                icon: House,
                title: "Care in context",
                text: "Consider the home environment, daily routines, and the practical needs of patients and families.",
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
            eyebrow="A NOTE ABOUT THIS DEMONSTRATION"
            title="A foundation for a real care organisation."
            description="The final company identity and business details are still to be provided. This demo does not represent verified staff, credentials, or service availability."
          />
          <dl>
            {[
              {
                title: "Our story & mission",
                text: "The company's history and approved mission will be added here.",
              },
              {
                title: "The people behind the care",
                text: "Verified team profiles and relevant qualifications will be introduced before launch.",
              },
              {
                title: "Our service locations",
                text: "Confirmed areas and local arrangements will be published when available.",
              },
              {
                title: "Professional credentials",
                text: "Applicable registrations and independently verified credentials will be provided by the company.",
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
  );
}
