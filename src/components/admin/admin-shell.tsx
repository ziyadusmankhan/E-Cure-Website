"use client";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { AccessibleDialog } from "@/components/ui/dialog";
import type { ThemeName } from "@/config/themes";
import { Button } from "@/components/ui/button";
export type AdminNavItem = { label: string; href: string };
export function AdminShell({
  title,
  navigation,
  children,
  theme,
}: {
  title: string;
  navigation: AdminNavItem[];
  children: ReactNode;
  theme?: ThemeName;
}) {
  const links = (
    <nav aria-label="Workspace sections">
      {navigation.map((item) => (
        <a href={item.href} key={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  );
  return (
    <div className="admin-shell">
      <aside className="admin-rail">
        <strong>Workspace preview</strong>
        {links}
      </aside>
      <div className="admin-main">
        <div className="admin-heading">
          <h3>{title}</h3>
          <div className="admin-mobile-menu">
            <AccessibleDialog
              theme={theme}
              title="Workspace navigation"
              description="Jump to a component example."
              drawer
              trigger={
                <Button variant="outline" size="small">
                  <Menu size={18} />
                  Sections
                </Button>
              }
            >
              {links}
            </AccessibleDialog>
          </div>
        </div>
        <p className="small muted">
          Component demonstration · Fictional records · No operational admin access
        </p>
        {children}
      </div>
    </div>
  );
}
