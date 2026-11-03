"use client";
import { useWebsite } from "@/components/website-provider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, ChevronDown, Menu, X, House } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { visibleLinks } from "@/config/profile-utils";
import { ServiceIcon } from "@/components/shared/service-icon";

export function Header() {
  const { site, services } = useWebsite();
  const navLinks = visibleLinks(site.navigation.main, site);
  const serviceIndex = Math.max(1, navLinks.findIndex(link=>link.section==="about")+1);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const active = (href: string) =>
    pathname === href || (href === "/#about" && pathname === "/about");
  return (
    <>
      <div className="utility-bar">
        <div className="container utility-inner">
          <span>
            <House size={13} aria-hidden="true" />
            {site.copy.layout_header_a_little_closer_to_home_1}
          </span>
          <span className="demo-label">
            <i />
            {site.copy.layout_header_website_demonstration_2}
          </span>
        </div>
      </div>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container header-inner">
          <Brand />
          <NavigationMenu.Root className="desktop-nav" aria-label="Main navigation">
            <NavigationMenu.List className="nav-list">
              {navLinks.slice(0, serviceIndex).map((link) => (
                <NavigationMenu.Item key={link.label}>
                  <NavigationMenu.Link asChild>
                    <Link
                      className={active(link.href) ? "nav-link active" : "nav-link"}
                      href={link.href}
                      aria-current={active(link.href) ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              ))}
              <NavigationMenu.Item className="services-nav">
                <NavigationMenu.Trigger
                  className={`nav-link nav-trigger ${pathname.startsWith("/services") ? "active" : ""}`}
                >
                  {site.navigation.servicesLabel}
                  <ChevronDown size={14} aria-hidden="true" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="services-dropdown">
                  <span className="eyebrow">{site.copy.layout_header_care_options_4}</span>
                  <div className="dropdown-grid">
                    {services.map((service) => (
                      <NavigationMenu.Link asChild key={service.slug}>
                        <Link href={`/services/${service.slug}`}>
                          <ServiceIcon slug={service.slug} size={20} />
                          <span>{service.title}</span>
                          <ArrowUpRight size={15} aria-hidden="true" />
                        </Link>
                      </NavigationMenu.Link>
                    ))}
                  </div>
                  <NavigationMenu.Link asChild>
                    <Link className="dropdown-all" href="/services">
                      {site.copy.layout_header_explore_all_home_health_services_5}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              {navLinks.slice(serviceIndex).map((link) => (
                <NavigationMenu.Item key={link.label}>
                  <NavigationMenu.Link asChild>
                    <Link
                      className={active(link.href) ? "nav-link active" : "nav-link"}
                      href={link.href}
                      aria-current={active(link.href) ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              ))}
            </NavigationMenu.List>
          </NavigationMenu.Root>
          {site.features.booking && (
            <Button asChild size="small" className="header-cta">
              <Link href="/book-appointment">
                {site.copy.layout_header_request_appointment_6}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </Button>
          )}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button className="mobile-menu-button" aria-label="Open navigation">
                <Menu size={24} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="drawer-overlay" />
              <Dialog.Content className="mobile-drawer">
                <div className="drawer-heading">
                  <Dialog.Title>{site.copy.layout_header_explore_home_care_7}</Dialog.Title>
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
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={active(link.href) ? "page" : undefined}
                    >
                      {link.label}
                      <ArrowUpRight size={18} />
                    </Link>
                  ))}
                  <span className="eyebrow">{site.copy.layout_header_our_services_9}</span>
                  {services.map((service) => (
                    <Link
                      className="mobile-service"
                      key={service.slug}
                      href={`/services/${service.slug}`}
                      onClick={() => setOpen(false)}
                    >
                      <ServiceIcon slug={service.slug} size={19} />
                      {service.title}
                    </Link>
                  ))}
                  <Link href="/services" onClick={() => setOpen(false)}>
                    {site.navigation.allServicesLabel}
                    <ArrowUpRight size={18} />
                  </Link>
                </nav>
                {site.features.booking && (
                  <Button asChild>
                    <Link href="/book-appointment" onClick={() => setOpen(false)}>
                      {site.copy.layout_header_request_an_appointment_11}
                      <ArrowUpRight size={18} />
                    </Link>
                  </Button>
                )}
                <p className="small muted">
                  {site.copy.layout_header_a_frontend_demo_no_appointments_12}
                </p>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>
    </>
  );
}
