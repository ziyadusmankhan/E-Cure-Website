"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useWebsite } from "@/components/website-provider";
import { ServiceIcon } from "@/components/shared/service-icon";

// Navigation disclosure: links retain native Tab behavior, with no menu-role
// focus proxies. It is intentionally not a modal or an application menu.
export function ServicesMenu({ active }: { active: boolean }) {
  const { site, services } = useWebsite();
  const [openMode, setOpenMode] = useState<"closed" | "hover" | "active">("closed");
  const open = openMode !== "closed";
  const id = useId();
  const item = useRef<HTMLLIElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const closeOnResize = () => {
      clearTimeout(hoverTimer.current);
      setOpenMode("closed");
    };
    window.addEventListener("resize", closeOnResize);
    return () => {
      window.removeEventListener("resize", closeOnResize);
      clearTimeout(hoverTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!item.current?.contains(event.target as Node)) {
        clearTimeout(hoverTimer.current);
        setOpenMode("closed");
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  return (
    <li
      ref={item}
      className="services-nav"
      onPointerEnter={(event) => {
        clearTimeout(hoverTimer.current);
        if (event.pointerType === "mouse")
          hoverTimer.current = setTimeout(() => setOpenMode(value => value === "closed" ? "hover" : value), 120);
      }}
      onPointerLeave={() => {
        clearTimeout(hoverTimer.current);
        // Bridge the small space between the trigger and panel, so diagonal
        // pointer travel doesn't dismiss a service the visitor is reaching for.
        hoverTimer.current = setTimeout(() => {
          if (!item.current?.contains(document.activeElement)) setOpenMode("closed");
        }, 160);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          clearTimeout(hoverTimer.current);
          setOpenMode("closed");
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          clearTimeout(hoverTimer.current);
          setOpenMode("closed");
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={`nav-link nav-trigger${active ? " active" : ""}`}
        aria-expanded={open}
        aria-controls={id}
        data-state={open ? "open" : "closed"}
        onClick={(event) => {
          clearTimeout(hoverTimer.current);
          const pointerActivation = event.detail > 0;
          // The first pointer click pins a hover-open disclosure. Keyboard
          // activation and subsequent clicks keep their normal toggle behavior.
          setOpenMode(value => value === "closed" || (value === "hover" && pointerActivation) ? "active" : "closed");
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          clearTimeout(hoverTimer.current);
          setOpenMode("active");
          const last = event.key === "ArrowUp";
          requestAnimationFrame(() => {
            const links = panel.current?.querySelectorAll("a");
            links?.[last ? links.length - 1 : 0]?.focus();
          });
        }}
      >
        {site.navigation.servicesLabel}<ChevronDown size={14} aria-hidden="true" />
      </button>
      <div ref={panel} id={id} className="services-dropdown" hidden={!open}>
        <span className="eyebrow">{site.copy.layout_header_care_options_4}</span>
        <div className="dropdown-grid">
          {services.map((service) => (
            <Link key={service.slug} href={`/services/${service.slug}`} onClick={() => {
              clearTimeout(hoverTimer.current);
              setOpenMode("closed");
            }}>
              <ServiceIcon slug={service.slug} size={20} />
              <span>{service.title}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          ))}
        </div>
        <Link className="dropdown-all" href="/services" onClick={() => {
          clearTimeout(hoverTimer.current);
          setOpenMode("closed");
        }}>
          {site.copy.layout_header_explore_all_home_health_services_5}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}
