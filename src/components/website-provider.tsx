"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { site } from "@/config/site";
import { activeServices } from "@/config/profile-utils";
import type { WebsiteSnapshot } from "@/types/cms";
import { presentationStyle, presentationTokenNames } from "@/config/client-presentation";
type ContextValue = WebsiteSnapshot & { onUpdate?: (value: WebsiteSnapshot) => void };
const Context = createContext<ContextValue>({
  site,
  services: activeServices(site),
  preview: false,
  revision: 0,
  theme: site.theme,
  colors: { primary: "", secondary: "" },
});
export const useWebsite = () => useContext(Context);
export function WebsiteProvider({
  value,
  children,
}: {
  value: WebsiteSnapshot;
  children: ReactNode;
}) {
  const [snapshot, onUpdate] = useState(value);
  useEffect(() => {
    document.documentElement.dataset.theme = snapshot.theme;
    if (snapshot.site.presentation)
      document.documentElement.dataset.presentation = snapshot.site.presentation;
    else delete document.documentElement.dataset.presentation;
    const tokens = presentationStyle(snapshot.site.presentation, {
      primary: snapshot.colors.primary,
      secondary: snapshot.colors.secondary,
    });
    for (const key of presentationTokenNames) {
      const color = tokens[key as `--${string}`];
      if (color) document.documentElement.style.setProperty(key, color);
      else document.documentElement.style.removeProperty(key);
    }
  }, [snapshot.theme, snapshot.site.presentation, snapshot.colors.primary, snapshot.colors.secondary]);
  return <Context.Provider value={{ ...snapshot, onUpdate }}>{children}</Context.Provider>;
}
// Server pages supply fresh data on client navigation, including persistent
// navigation/branding, without a second browser data request.
export function WebsitePage({ value, children }: { value: WebsiteSnapshot; children: ReactNode }) {
  const { onUpdate } = useContext(Context);
  useEffect(() => {
    onUpdate?.(value);
  }, [value, onUpdate]);
  return <Context.Provider value={{ ...value, onUpdate }}>{children}</Context.Provider>;
}
