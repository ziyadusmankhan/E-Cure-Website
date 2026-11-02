"use client";
import * as Primitive from "@radix-ui/react-dialog";
import { useState, type ReactElement, type ReactNode } from "react";
import { X } from "lucide-react";
import type { ThemeName } from "@/config/themes";
export function AccessibleDialog({
  trigger,
  title,
  description,
  children,
  drawer = false,
  theme,
}: {
  trigger: ReactElement;
  title: string;
  description: string;
  children: ReactNode;
  drawer?: boolean;
  theme?: ThemeName;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Primitive.Root open={open} onOpenChange={setOpen}>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Overlay className="drawer-overlay" />
        <Primitive.Content
          data-theme={theme}
          className={drawer ? "mobile-drawer design-drawer" : "design-dialog"}
          onClick={event => {
            if (event.target instanceof Element && event.target.closest("a[href]")) setOpen(false);
          }}
        >
          <Primitive.Title>{title}</Primitive.Title>
          <Primitive.Description>{description}</Primitive.Description>
          <Primitive.Close asChild>
            <button className="dialog-close icon-button" aria-label={`Close ${title}`}>
              <X size={20} />
            </button>
          </Primitive.Close>
          {children}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
