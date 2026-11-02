import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { services } from "@/data/services";
import { site } from "@/config/site";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Brand />
            <p>A thoughtful starting point for finding care in the place you call home.</p>
            <span className="small muted">Temporary branding · Frontend demonstration</span>
          </div>
          <div>
            <h2>Explore</h2>
            <Link href="/about">About home care</Link>
            <Link href="/services">All services</Link>
            <Link href="/faq">Frequently asked questions</Link>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/book-appointment">Request an appointment</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <h2>Our services</h2>
            {services.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`}>
                {s.title}
              </Link>
            ))}
          </div>
          <div>
            <h2>Let’s connect</h2>
            {site.contact.email ? (
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
            ) : (
              <p>Contact details coming soon.</p>
            )}
            {site.contact.phone && <a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a>}
            <p>{site.contact.serviceArea || "Service areas to be confirmed."}</p>
            <Link href="/contact" className="footer-contact">
              Explore contact options <ArrowUpRight size={16} />
            </Link>
            {site.socialLinks.length ? (
              site.socialLinks.map((link) => (
                <a href={link.url} key={link.label} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))
            ) : (
              <span className="small muted">Social profiles to be added</span>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {site.name}. Demonstration website.
          </span>
          <Link href="/privacy-policy">
            Provisional privacy policy <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
