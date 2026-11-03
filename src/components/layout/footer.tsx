"use client";
import { useWebsite } from "@/components/website-provider";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { visibleLinks } from "@/config/profile-utils";
export function Footer() {
  const { site, services } = useWebsite();
 const footerNavigation = visibleLinks(site.navigation.footer,site);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Brand />
            <p>{site.copy.layout_footer_a_thoughtful_starting_point_for_1}</p>
            <span className="small muted">
              {site.copy.layout_footer_temporary_branding_frontend_demonstration_2}
            </span>
          </div>
          <div>
            <h2>{site.copy.layout_footer_explore_3}</h2>
            {footerNavigation.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
          <div>
            <h2>{site.copy.layout_footer_our_services_10}</h2>
            {services.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`}>
                {s.title}
              </Link>
            ))}
          </div>
          <div>
            <h2>{site.copy.layout_footer_lets_connect_11}</h2>
            {site.contact.email ? (
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
            ) : (
              <p>{site.copy.layout_footer_contact_details_coming_soon_12}</p>
            )}
            {site.contact.phone && <a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a>}
            <p>{site.contact.serviceArea || "Service areas to be confirmed."}</p>
            <Link href="/contact" className="footer-contact">
              {site.copy.layout_footer_explore_contact_options_13}
              <ArrowUpRight size={16} />
            </Link>
            {site.socialLinks.length ? (
              site.socialLinks.map((link) => (
                <a href={link.url} key={link.label} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))
            ) : (
              <span className="small muted">
                {site.copy.layout_footer_social_profiles_to_be_added_14}
              </span>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            {site.copy.layout_footer__15}
            {new Date().getFullYear()} {site.name}
            {site.copy.layout_footer__demonstration_website_16}
          </span>
          <Link href="/privacy-policy">
            {site.copy.layout_footer_provisional_privacy_policy_17}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
