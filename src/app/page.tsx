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

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" /> CARE THAT FEELS CLOSER
            </span>
            <h1>
              Compassionate
              <br className="desktop-break" /> healthcare,
              <br />
              <em>closer to home.</em>
            </h1>
            <p>
              For the everyday moments. For the times you need a little more support. Explore
              thoughtful healthcare in the comfort of home.
            </p>
            <div className="hero-actions">
              <Button asChild>
                <Link href="/services">
                  Explore our services <ArrowUpRight size={18} />
                </Link>
              </Button>
              <Link href="/book-appointment" className="text-link">
                Request an appointment <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="hero-note">
              <HandHeart size={23} strokeWidth={1.4} aria-hidden="true" />
              <span>
                For you. For your family.
                <br />
                <strong>For the place you call home.</strong>
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <Image
                src="/images/home-care.jpg"
                alt="A care companion reading with an older man in a bright, comfortable home"
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
                  Familiar surroundings.
                  <br />A more personal care experience.
                </strong>
                <span>Discover the possibilities of home care</span>
              </div>
            </div>
            <span className="photo-note">Care imagery for illustration</span>
          </div>
        </div>
        <div className="container hero-foot">
          <span>CLINICAL CARE. EVERYDAY SUPPORT. ONE PLACE TO START.</span>
          <a href="#services" aria-label="Discover our services">
            <ArrowDown size={18} />
          </a>
        </div>
      </section>
      <section className="services-section section" id="services">
        <div className="container">
          <div className="section-top">
            <SectionHeading
              eyebrow="OUR SERVICES"
              title="Different needs. Thoughtful care."
              description="From professional care to everyday assistance, find the support that fits your next chapter."
            />
            <span className="section-aside">
              Support for life,
              <br />
              at home.
            </span>
          </div>
          <div className="services-grid">
            {services.map((service, i) => (
              <ServiceCard service={service} index={i} key={service.slug} />
            ))}
          </div>
          <div className="section-bottom">
            <p>Not sure where to start? Explore the full picture.</p>
            <Link className="text-link" href="/services">
              View all home health services <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="about-preview section" id="about">
        <div className="container editorial-grid">
          <div className="about-image">
            <Image
              src="/images/caregiver.jpg"
              alt="A caregiver offering a steady hand to an older woman at home"
              fill
              sizes="(max-width: 760px) 100vw, 45vw"
            />
            <div className="image-label">
              <Heart size={18} strokeWidth={1.5} />
              <span>Care starts with understanding.</span>
            </div>
          </div>
          <div className="editorial-copy">
            <SectionHeading
              eyebrow="A MORE PERSONAL APPROACH"
              title="Home is more than a place. It’s where life happens."
            />
            <p>
              Care should consider the person, their routines, and the people who matter to them.
              Home healthcare offers a way to explore support in a familiar setting.
            </p>
            <p>
              Whether you’re considering help for yourself or a loved one, this is a place to
              understand your options and take the next step with a little more clarity.
            </p>
            <Link href="/about" className="text-link">
              Get to know home healthcare <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="why-section section" id="why-home-care">
        <div className="container why-grid">
          <div>
            <SectionHeading
              eyebrow="WHY HOME HEALTHCARE?"
              title="Familiar places. Meaningful possibilities."
            />
            <p className="why-intro">
              The right care arrangement is personal. Here are a few reasons people explore support
              at home.
            </p>
            <div className="why-illustration" aria-hidden="true">
              <House strokeWidth={0.7} />
              <span>Here, life feels familiar.</span>
            </div>
          </div>
          <div className="benefits-list">
            {benefits.map((benefit, i) => (
              <article key={benefit.title}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.text}</p>
                </div>
              </article>
            ))}
            <p className="small muted">
              Suitability and service arrangements depend on individual needs and confirmed
              availability.
            </p>
          </div>
        </div>
      </section>
      <section className="process-section section" id="how-it-works">
        <div className="container">
          <SectionHeading
            eyebrow="A CLEARER WAY FORWARD"
            title="From a question to a care plan."
            description="A simple introduction to how arranging home care could work."
          />
          <div className="steps-grid">
            {steps.map((step, i) => (
              <article key={step.title}>
                <div className="step-number">
                  0{i + 1}
                  <span />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
          <p className="demo-inline">
            <span /> Try the journey. This demo does not send requests or confirm appointments.
          </p>
        </div>
      </section>
      {site.showTestimonials && (
        <section className="testimonial-section" aria-labelledby="testimonials-heading">
          <div className="container testimonial-inner">
            <Quote size={42} strokeWidth={1} aria-hidden="true" />
            <div>
              <span className="eyebrow">PATIENT & FAMILY VOICES</span>
              <h2 id="testimonials-heading">A space for real experiences.</h2>
              <p>
                Care stories deserve to be authentic. Approved patient and family testimonials will
                appear here when available.
              </p>
            </div>
            <span className="outline-label">DEMONSTRATION PLACEHOLDER</span>
          </div>
        </section>
      )}
      <CTASection />
      <section className="contact-preview section" id="contact">
        <div className="container contact-preview-grid">
          <div>
            <SectionHeading
              eyebrow="START A CONVERSATION"
              title="Let’s talk about what you need."
            />
            <p>Explore your options, ask a question, or try the appointment request experience.</p>
            <Link className="text-link" href="/contact">
              Visit our contact page <ArrowUpRight size={18} />
            </Link>
          </div>
          <ContactDetails />
        </div>
      </section>
    </>
  );
}
