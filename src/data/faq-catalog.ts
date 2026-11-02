export type FAQGroup = {
  id: string;
  title: string;
  description: string;
  items: { question: string; answer: string }[];
};

export const faqGroups: FAQGroup[] = [
  {
    id: "choosing-care",
    title: "Finding the right kind of support",
    description: "Understand the options before taking your next step.",
    items: [
      {
        question: "Where should I start if I’m unsure which service to choose?",
        answer:
          "Start with the services directory. Each page explains the general scope, who may benefit, and what to ask before arranging care. For a real arrangement, the provider would discuss your needs and confirm whether a service is suitable. This demo cannot assess care needs.",
      },
      {
        question: "How is caretaker support different from nursing care?",
        answer:
          "Caretaker support focuses on non-medical daily assistance and companionship. Nursing involves clinical responsibilities that require appropriately qualified professionals and an agreed scope of care. The services are distinct; one should not be assumed to replace the other.",
      },
      {
        question: "Are all services available in my area?",
        answer:
          "Locations, visit arrangements, professional availability, and service scope have not yet been confirmed. The descriptions introduce potential care options. A real provider must check your area and requirements before agreeing any arrangement.",
      },
      {
        question: "Can I explore services on behalf of a family member?",
        answer:
          "Yes. You can explore information and try the request flow as a family contact. In a real service, the person’s wishes, consent, and appropriate family involvement would need to be considered before sharing information or arranging support.",
      },
    ],
  },
  {
    id: "appointment-requests",
    title: "Understanding appointment requests",
    description: "What a request means and which details would need confirmation.",
    items: [
      {
        question: "Does completing the form book an appointment?",
        answer:
          "No. A saved request is not a confirmed appointment. Preview mode does not submit entries; local test mode saves fictional requests to the local database. A real appointment requires a separate agreement about suitability, availability and practical details.",
      },
      {
        question: "Is my preferred date or time guaranteed?",
        answer:
          "No. The date and time window are preferences, not available appointment slots. A real care team would discuss timing and confirm the arrangement separately. This demo does not check a clinician’s calendar.",
      },
      {
        question: "Can I change my details before completing the demo?",
        answer:
          "Yes. The booking form has a review step where you can change the selected service or edit your example details. You can go back without losing what you typed. Completing the demo clears the form entries.",
      },
      {
        question: "Where can I find prices and payment information?",
        answer:
          "Prices and payment arrangements have not been provided. There is no checkout or payment collection in this demonstration. A real provider would need to explain the service scope, costs, and applicable terms before care is agreed.",
      },
    ],
  },
  {
    id: "using-this-demo",
    title: "Using this demonstration",
    description: "Clear information about the website you’re exploring.",
    items: [
      {
        question: "What information should I enter in the forms?",
        answer:
          "Use fictional contact details only. Please leave out medical histories, identification documents, test results, and other sensitive health information. General questions about arrangements are enough to explore the form experience.",
      },
      {
        question: "Are form entries sent or saved?",
        answer:
          "Read the notice on the form. Preview mode keeps entries only in browser memory. Local test mode saves fictional requests in the local database and uses Cloudflare Turnstile for a test security check. Neither mode arranges care or sends a team notification. The privacy notice explains the active mode.",
      },
      {
        question: "Why are some business and contact details missing?",
        answer:
          "The company identity, contact channels, service locations, and other operational details are awaiting confirmation. They are marked clearly so the demonstration does not imply unverified information. The WhatsApp icon displays an information panel until a real contact URL is configured.",
      },
      {
        question: "Can this website provide urgent assistance?",
        answer:
          "No. Test messages are not monitored for care or emergencies. This demonstration cannot arrange urgent assistance. Do not rely on its appointment or contact forms for urgent care.",
      },
    ],
  },
];

export const homepageFAQs = [faqGroups[0].items[0], faqGroups[0].items[1], faqGroups[1].items[0]];
