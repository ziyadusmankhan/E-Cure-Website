"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, CalendarDays, ChevronRight, FilePenLine, LayoutDashboard, Menu, MessagesSquare, ShieldCheck, Users, X } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { LogoutButton } from "./auth-forms";

const CloseNavigation = createContext<() => void>(() => {});
const icons = {
  "/admin": LayoutDashboard,
  "/admin/appointments": CalendarDays,
  "/admin/customers": Users,
  "/admin/inquiries": MessagesSquare,
  "/admin/website": FilePenLine,
  "/admin/access": ShieldCheck,
};

export function StaffNavigationLink({ href, children }: { href: keyof typeof icons; children: ReactNode }) {
  const pathname = usePathname();
  const close = useContext(CloseNavigation);
  const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
  const Icon = icons[href];
  return (
    <Link href={href} prefetch={false} onClick={close} aria-current={active ? pathname === href ? "page" : "location" : undefined}>
      <Icon size={19} aria-hidden="true" /><span>{children}</span>
      {active && <ChevronRight size={15} className="staff-active-arrow" aria-hidden="true" />}
    </Link>
  );
}

// The verified server layout supplies the navigation and role label. This
// component controls presentation only; it never decides access to a section.
export function StaffFrame({ navigation, roleLabel, children }: { navigation: ReactNode; roleLabel: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  const identity = <div className="staff-identity"><ShieldCheck size={19} aria-hidden="true" /><span><strong>{roleLabel}</strong><small>Staff account</small></span></div>;
  return (
    <CloseNavigation.Provider value={() => setOpen(false)}>
      <div className="admin-workspace">
        <aside className="admin-workspace-nav staff-sidebar">
          <Brand />
          <p className="staff-nav-label">Staff workspace</p>
          {navigation}
          <div className="staff-sidebar-bottom">{identity}<LogoutButton /></div>
        </aside>
        <div className="staff-main">
          <header className="staff-toolbar">
            <div className="staff-toolbar-title"><span className="staff-desktop-label">Staff workspace</span><span className="staff-mobile-label">Workspace</span><span className="staff-role">{roleLabel}</span></div>
            <Link href="/" className="staff-website-link">View website<ArrowUpRight size={15} aria-hidden="true" /></Link>
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger className="staff-menu-trigger" aria-label="Workspace navigation"><Menu size={22} aria-hidden="true" /></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="staff-nav-overlay" />
                <Dialog.Content className="staff-nav-dialog">
                  <div className="staff-dialog-heading"><Brand onNavigate={() => setOpen(false)} /><Dialog.Close className="staff-menu-close" aria-label="Close workspace navigation"><X size={22} aria-hidden="true" /></Dialog.Close></div>
                  <Dialog.Title className="staff-nav-label">Workspace navigation</Dialog.Title>
                  <Dialog.Description className="sr-only">Choose a staff section. Press Escape to close this navigation.</Dialog.Description>
                  {navigation}
                  <div className="staff-sidebar-bottom">{identity}<LogoutButton /></div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </header>
          <div className="admin-workspace-content">{children}</div>
          <p className="staff-workspace-footer">Staff workspace · Sign out when you finish on a shared device.</p>
        </div>
      </div>
    </CloseNavigation.Provider>
  );
}
