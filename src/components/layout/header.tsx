"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, ChevronDown, Menu, X, House } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { services } from "@/data/services";
import { ServiceIcon } from "@/components/shared/service-icon";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Why home care", href: "/#why-home-care" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];
export function Header() {
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
            <House size={13} aria-hidden="true" /> A little closer to home. A little more care.
          </span>
          <span className="demo-label">
            <i /> Website demonstration
          </span>
        </div>
      </div>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container header-inner">
          <Brand />
          <NavigationMenu.Root className="desktop-nav" aria-label="Main navigation">
            <NavigationMenu.List className="nav-list">
              {navLinks.slice(0, 2).map((link) => (
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
                  Services <ChevronDown size={14} aria-hidden="true" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="services-dropdown">
                  <span className="eyebrow">CARE OPTIONS</span>
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
                      Explore all home health services <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
              {navLinks.slice(2).map((link) => (
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
          <Button asChild size="small" className="header-cta">
            <Link href="/book-appointment">
              Request appointment <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </Button>
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
                  <Dialog.Title>Explore home care</Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="icon-button" aria-label="Close navigation">
                      <X />
                    </button>
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">
                  Main navigation and healthcare services
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
                  <span className="eyebrow">OUR SERVICES</span>
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
                    All home health services <ArrowUpRight size={18} />
                  </Link>
                </nav>
                <Button asChild>
                  <Link href="/book-appointment" onClick={() => setOpen(false)}>
                    Request an appointment <ArrowUpRight size={18} />
                  </Link>
                </Button>
                <p className="small muted">A frontend demo. No appointments are booked.</p>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>
    </>
  );
}
