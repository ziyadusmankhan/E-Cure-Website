"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { site } from "@/config/site";

function WhatsAppIcon() {
  return (
    <svg width="29" height="29" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M27.5 15.5a11.5 11.5 0 0 1-17.1 10L4 27l1.7-6.1A11.5 11.5 0 1 1 27.5 15.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.7c-.4-.9-.8-.9-1.1-.9h-.9c-.3 0-.8.2-1.1.6-.4.5-1.4 1.4-1.4 3.3s1.5 3.8 1.7 4.1c.2.2 2.9 4.5 7.1 6.1 3.5 1.3 4.2.9 5 .8.8-.1 2.5-1 2.8-2 .4-1 .4-1.8.3-2-.1-.2-.4-.3-.9-.6l-2.8-1.3c-.4-.2-.7-.3-1 .2-.3.4-1.1 1.3-1.4 1.6-.2.3-.5.3-.9.1-.5-.2-1.9-.7-3.5-2.1-1.3-1.1-2.1-2.5-2.4-3-.2-.4 0-.6.2-.8l.6-.7.5-.8c.2-.3.1-.6 0-.8L12 9.7Z"
        fill="currentColor"
        transform="translate(2 1) scale(.85)"
      />
    </svg>
  );
}

export function WhatsAppContact() {
  if (site.contact.whatsappUrl) {
    return (
      <a
        className="whatsapp-button"
        href={site.contact.whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Contact us on WhatsApp"
      >
        <WhatsAppIcon />
      </a>
    );
  }

  return (
    <Dialog.Root modal={false}>
      <Dialog.Trigger asChild>
        <button className="whatsapp-button" aria-label="WhatsApp contact information">
          <WhatsAppIcon />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="whatsapp-panel">
          <Dialog.Close asChild>
            <button className="whatsapp-close" aria-label="Close WhatsApp information">
              <X size={18} />
            </button>
          </Dialog.Close>
          <span className="eyebrow">LET’S CONNECT</span>
          <Dialog.Title>WhatsApp, coming soon.</Dialog.Title>
          <Dialog.Description>
            We’ll add a direct chat link once the company’s contact number is confirmed. This
            demonstration cannot send messages.
          </Dialog.Description>
          <Dialog.Close asChild>
            <Link href="/contact" className="text-link">
              Explore contact options <ArrowUpRight size={16} />
            </Link>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
