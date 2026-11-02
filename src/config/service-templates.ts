import type { Service } from "@/types/service";
type TemplateInput = Pick<
  Service,
  | "slug"
  | "title"
  | "headline"
  | "description"
  | "overview"
  | "includes"
  | "audience"
  | "preparation"
  | "related"
> & { icon: string };
function consultation(input: TemplateInput): Service {
  return {
    ...input,
    shortTitle: input.title.toLowerCase(),
    label: "Illustrative service · Scope to be confirmed",
    image:
      input.icon === "physiotherapy" ? "/images/physiotherapy.jpg" : "/images/consultation.svg",
    imageAlt:
      input.icon === "physiotherapy"
        ? "Illustrative stock photograph of a physiotherapy session"
        : "Editorial illustration of a consultation",
    expectation:
      "The provider would discuss your needs, the appointment format and any professional requirements before agreeing a visit. This fictional demonstration cannot arrange care or confirm availability.",
    faqs: [
      {
        question: "Is this service available to book now?",
        answer:
          "No. This is a fictional business configuration for demonstration. Availability, professionals, location and service scope would all require confirmation before any real care arrangement.",
      },
      {
        question: "What should I prepare for an inquiry?",
        answer:
          "For this demo, use fictional contact details and a general question only. For a real inquiry, ask the confirmed provider which information is needed and avoid sharing sensitive information through an unverified channel.",
      },
    ],
  };
}
export const additionalServices: Service[] = [
  consultation({
    slug: "general-consultation",
    title: "General Consultation",
    icon: "online-consultation",
    headline: "A clear starting point for your care questions.",
    description:
      "Explore the process of arranging a general consultation with a suitable professional.",
    overview:
      "A general consultation can be a starting point for discussing a concern and understanding appropriate next steps. This page illustrates how a clinic could explain its consultation service; professional details and scope are not confirmed.",
    includes: [
      {
        title: "Appointment inquiry",
        description:
          "Discuss the type of visit being explored and whether the clinic can support it.",
      },
      {
        title: "Visit preparation",
        description:
          "Confirm the appointment format and any preparation through the real provider.",
      },
      {
        title: "Next-step discussion",
        description: "Any clinical guidance would follow an appropriate professional assessment.",
      },
    ],
    audience: [
      "People exploring an initial consultation",
      "Families helping someone understand appointment options",
    ],
    preparation: [
      "Prepare the questions you want to discuss.",
      "Confirm the location and professional before a real visit.",
    ],
    related: ["follow-up-consultation", "laboratory-services"],
  }),
  consultation({
    slug: "follow-up-consultation",
    title: "Follow-up Consultation",
    icon: "online-consultation",
    headline: "Room for your next conversation.",
    description:
      "Explore arrangements for a follow-up discussion after an earlier professional visit.",
    overview:
      "Follow-up arrangements depend on the previous assessment and the advice of the treating professional. This example introduces a request-first approach without promising a particular professional, timeline or outcome.",
    includes: [
      {
        title: "Follow-up request",
        description: "Explain that you are seeking a follow-up and confirm who should review it.",
      },
      {
        title: "Practical arrangements",
        description:
          "Discuss location, format and any instructions from the treating professional.",
      },
      {
        title: "Continuity questions",
        description: "Ask how the confirmed provider handles communication between appointments.",
      },
    ],
    audience: [
      "People advised to arrange a follow-up",
      "Family contacts assisting with practical visit arrangements",
    ],
    preparation: [
      "Follow the instructions from your treating professional.",
      "Ask which details the confirmed provider requires.",
    ],
    related: ["general-consultation"],
  }),
  consultation({
    slug: "mobility-assessment",
    title: "Mobility Assessment",
    icon: "physiotherapy",
    headline: "Understand the movements that shape your day.",
    description: "Explore an assessment conversation about everyday movement and mobility goals.",
    overview:
      "An assessment may help a qualified physiotherapist understand movement concerns and discuss what support could be appropriate. This is an illustrative service, with no assessment result or treatment plan offered by this website.",
    includes: [
      {
        title: "Everyday movement discussion",
        description: "Talk about activities that matter to the individual.",
      },
      {
        title: "Professional assessment",
        description:
          "Any assessment would be performed by a suitable professional after arranging a real appointment.",
      },
      {
        title: "Practical next steps",
        description:
          "Discuss possible support only after the professional has assessed individual needs.",
      },
    ],
    audience: [
      "People exploring a movement assessment",
      "People seeking clarity about everyday mobility support",
    ],
    preparation: [
      "Consider the daily activities you want to discuss.",
      "Confirm the setting and referral requirements with the real provider.",
    ],
    related: ["physiotherapy", "rehabilitation-support"],
  }),
  consultation({
    slug: "rehabilitation-support",
    title: "Rehabilitation Support",
    icon: "physiotherapy",
    headline: "A considered approach to your rehabilitation questions.",
    description: "Explore support around rehabilitation goals and an individually assessed plan.",
    overview:
      "Rehabilitation support should reflect a person's goals and appropriate professional guidance. This example describes a discussion-based starting point without prescribing exercises, promising recovery or representing a confirmed treatment service.",
    includes: [
      {
        title: "Goal discussion",
        description:
          "Share the activities and routines the person hopes to discuss with a professional.",
      },
      {
        title: "Assessment-led planning",
        description: "Any plan would follow a qualified assessment and relevant clinical guidance.",
      },
      {
        title: "Review arrangements",
        description:
          "Confirm how progress and further appointments would be discussed with the provider.",
      },
    ],
    audience: [
      "People advised to explore rehabilitation support",
      "Families helping plan appropriate practical arrangements",
    ],
    preparation: [
      "Ask about referral or prior-assessment requirements.",
      "Prepare general questions about professional support and appointment arrangements.",
    ],
    related: ["physiotherapy", "mobility-assessment"],
  }),
];
