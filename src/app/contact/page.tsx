import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ContactDetails } from "@/components/shared/contact-details";
import { ContactForm } from "@/components/forms/contact-form";
export const metadata: Metadata = {
  title: "Contact & inquiries",
  description:
    "Explore contact options and try a demonstration inquiry form for home healthcare services.",
};
export default function ContactPage() {
  return (
    <>
      <div className="page-intro">
        <div className="container">
          <Breadcrumbs items={[{ label: "Contact" }]} />
          <span className="eyebrow">LET’S START WITH A CONVERSATION</span>
          <h1>
            A question is
            <br />a good place to begin.
          </h1>
          <p>
            Whether you’re exploring options for yourself or someone you love, take a moment to
            share what you’re looking for.
          </p>
        </div>
      </div>
      <section className="section">
        <div className="container contact-page-grid">
          <div>
            <h2>Ways to connect</h2>
            <p className="muted">
              Real contact details and service locations will be added once confirmed.
            </p>
            <ContactDetails />
            <div className="contact-booking">
              <span className="eyebrow">ALREADY HAVE A SERVICE IN MIND?</span>
              <h3>Try the appointment experience.</h3>
              <Link className="text-link" href="/book-appointment">
                Request an appointment <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
