"use client";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";

export function FAQ({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className="faq-list">
      {items.map((item, index) => (
        <AccordionPrimitive.Item className="faq-item" value={`item-${index}`} key={item.question}>
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="faq-trigger">
              {item.question}
              <Plus size={20} aria-hidden="true" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="faq-content">
            <p>{item.answer}</p>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
