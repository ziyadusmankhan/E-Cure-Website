"use client";
import { useWebsite } from "@/components/website-provider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, CalendarDays, ChevronDown, Mail, MapPin, Menu, Phone, X, House } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { contactPhones, visibleLinks } from "@/config/profile-utils";
import { ServiceIcon } from "@/components/shared/service-icon";
import { ServicesMenu } from "./services-menu";

export function Header() {
  const { site, services } = useWebsite();
  const ecure = site.presentation === "ecure";
  const phones = contactPhones(site.contact);
  const bookingHref = site.features.booking ? "/book-appointment" : "/contact";
  const bookingLabel = ecure ? "Contact for Booking" : site.copy.layout_header_request_appointment_6;
  const navLinks = visibleLinks(site.navigation.main, site);
  const serviceIndex = Math.max(1, navLinks.findIndex((link) => link.section === "about") + 1);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const desktop = window.matchMedia(ecure ? "(min-width: 1024px)" : "(min-width: 981px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [ecure]);
  const closeMenu = () => {
    setOpen(false);
    setServicesOpen(false);
  };
  const active = (href: string) =>
    pathname === href || (href === "/#about" && pathname === "/about");
  const mobileLinks = (links: typeof navLinks) => links.map((link) => (
    <Link
      key={link.label}
      href={link.href}
      onClick={closeMenu}
      aria-current={active(link.href) ? "page" : undefined}
    >
      {link.label}<ArrowUpRight size={18} aria-hidden="true" />
    </Link>
  ));
  const mobileServices = services.map((service) => (
    <Link className="mobile-service" key={service.slug} href={`/services/${service.slug}`} onClick={closeMenu}>
      <ServiceIcon slug={service.slug} size={19} />{service.title}
    </Link>
  ));
  return (
    <>
      <div className="utility-bar">
        <div className="container utility-inner">
          <span>
            {ecure ? <MapPin size={14} aria-hidden="true" /> : <House size={13} aria-hidden="true" />}
            {site.copy.layout_header_a_little_closer_to_home_1}
          </span>
          {ecure && (phones.length > 0 || site.contact.email) && <div className="utility-contact">
            {phones.map(([href, label]) => <a key={href} href={href}><Phone size={13} aria-hidden="true" />{label}</a>)}
            {site.contact.email && <a href={`mailto:${site.contact.email}`}><Mail size={13} aria-hidden="true" />{site.contact.email}</a>}
          </div>}
          {site.demo && !ecure && <span className="demo-label">
            <i />
            {site.copy.layout_header_website_demonstration_2}
          </span>}
        </div>
      </div>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            <ul className="nav-list">
              {navLinks.slice(0, serviceIndex).map((link) => (
                <li key={link.label}>
                    <Link
                      className={active(link.href) ? "nav-link active" : "nav-link"}
                      href={link.href}
                      aria-current={active(link.href) ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                </li>
              ))}
              <ServicesMenu active={pathname.startsWith("/services")} />
              {navLinks.slice(serviceIndex).map((link) => (
                <li key={link.label}>
                    <Link
                      className={active(link.href) ? "nav-link active" : "nav-link"}
                      href={link.href}
                      aria-current={active(link.href) ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                </li>
              ))}
            </ul>
          </nav>
          {(site.features.booking || ecure) && (
            <Button asChild size="small" className="header-cta">
              <Link href={bookingHref}>
                {bookingLabel}
                {ecure ? <CalendarDays size={17} aria-hidden="true" /> : <ArrowUpRight size={16} aria-hidden="true" />}
              </Link>
            </Button>
          )}
          {ecure && phones[0] && <a className="mobile-call" href={phones[0][0]} aria-label={`Call ${site.name}`}><Phone size={20} aria-hidden="true" /></a>}
          <Dialog.Root open={open} onOpenChange={(value) => {
            setOpen(value);
            if (!value) setServicesOpen(false);
          }}>
            <Dialog.Trigger asChild>
              <button className="mobile-menu-button" aria-label="Open navigation">
                <Menu size={24} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="drawer-overlay" />
              <Dialog.Content className="mobile-drawer">
                <div className="drawer-heading">
                  {ecure && <Brand onNavigate={closeMenu} />}
                  <Dialog.Title className={ecure ? "sr-only" : undefined}>{site.copy.layout_header_explore_home_care_7}</Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="icon-button" aria-label="Close navigation">
                      <X />
                    </button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">
                  {site.copy.layout_header_main_navigation_and_healthcare_services_8}
                </Dialog.Description>
                <nav aria-label="Mobile navigation">
                  {ecure ? <>
                    {mobileLinks(navLinks.slice(0, serviceIndex))}
                    <button className="mobile-services-trigger" type="button" aria-expanded={servicesOpen} aria-controls="mobile-services-list" onClick={() => setServicesOpen(!servicesOpen)}>
                      {site.navigation.servicesLabel}<ChevronDown size={18} aria-hidden="true" />
                    </button>
                    <div id="mobile-services-list" className="mobile-services-list" hidden={!servicesOpen}>
                      {mobileServices}
                      <Link href="/services" onClick={closeMenu}>{site.navigation.allServicesLabel}<ArrowUpRight size={16} aria-hidden="true" /></Link>
                    </div>
                    {mobileLinks(navLinks.slice(serviceIndex))}
                  </> : <>
                    {mobileLinks(navLinks)}
                    <span className="eyebrow">{site.copy.layout_header_our_services_9}</span>
                    {mobileServices}
                    <Link href="/services" onClick={closeMenu}>{site.navigation.allServicesLabel}<ArrowUpRight size={18} aria-hidden="true" /></Link>
                  </>}
                </nav>
                {(site.features.booking || ecure) && (
                  <Button asChild>
                    <Link href={bookingHref} onClick={closeMenu}>
                      {ecure ? bookingLabel : site.copy.layout_header_request_an_appointment_11}
                      {ecure ? <CalendarDays size={18} aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}
                    </Link>
                  </Button>
                )}
                <p className="small muted">
                  {ecure ? "Call, email or message us on WhatsApp to arrange care." : site.copy.layout_header_a_frontend_demo_no_appointments_12}
                </p>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
        {ecure && <div className="container mobile-booking-row">
          <Link href={bookingHref}><CalendarDays size={17} aria-hidden="true" />{bookingLabel}<ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>}
      </header>
    </>
  );
}
