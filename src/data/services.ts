import type { Service } from "@/types/service";

export const services: Service[] = [
  {
    slug: "online-consultation",
    title: "Online Consultation",
    shortTitle: "Online consultation",
    label: "A conversation from home",
    description:
      "Explore remote appointments and discuss your next steps from a place that feels comfortable.",
    headline: "A little less travel. A little more clarity.",
    overview:
      "Remote consultations can make it easier to start a conversation about your care. Ask about available professionals and appointment formats, and find out whether an online visit is appropriate for your needs.",
    image: "/images/consultation.svg",
    imageAlt: "Illustration of a video consultation on a laptop",
    includes: [
      {
        title: "Remote appointment inquiries",
        description:
          "Discuss the type of consultation you are looking for and ask which options may be available.",
      },
      {
        title: "Preparation guidance",
        description:
          "Confirm the connection method, appointment length, and any information the professional needs in advance.",
      },
      {
        title: "A discussion of next steps",
        description:
          "A suitable professional can explain whether further assessment or an in-person visit may be needed.",
      },
    ],
    audience: [
      "People who want to discuss whether remote care is suitable",
      "Families helping a loved one arrange a consultation",
      "People exploring follow-up options with a care professional",
    ],
    expectation:
      "The consultation format and professional must be confirmed before an appointment. Some concerns require an in-person assessment; online care is not suitable for every situation.",
    preparation: [
      "Choose a quiet, private space with a reliable connection.",
      "Check the agreed call method before the appointment.",
      "Prepare the questions you would like to discuss.",
    ],
    faqs: [
      {
        question: "Can every concern be discussed online?",
        answer:
          "No. Suitability depends on the concern and the professional's assessment. You may be advised to arrange an in-person visit. This demo cannot assess your needs.",
      },
      {
        question: "Will a prescription be provided?",
        answer:
          "Prescriptions are not promised. Any clinical advice or prescribing depends on the professional, the assessment, and applicable requirements. Confirm the scope when arranging a real appointment.",
      },
      {
        question: "What technology will I need?",
        answer:
          "The consultation platform has not been selected for this demo. A real service would confirm the device, connection, and joining instructions in advance.",
      },
    ],
    related: ["nursing-care", "laboratory-services"],
  },
  {
    slug: "physiotherapy",
    title: "Physiotherapy",
    shortTitle: "Physiotherapy",
    label: "Movement & rehabilitation",
    description:
      "Explore support for movement, everyday mobility, and rehabilitation in familiar surroundings.",
    headline: "Support for the movements that matter.",
    overview:
      "Everyday movements can make a meaningful difference to daily life. Home physiotherapy may offer an opportunity to discuss mobility goals and explore a suitable rehabilitation approach with a qualified professional, where visits are available.",
    image: "/images/physiotherapy.jpg",
    imageAlt: "Physiotherapist assisting a person with a supported movement in a treatment room",
    includes: [
      {
        title: "Movement assessment",
        description:
          "A professional may assess movement and everyday mobility to understand individual needs.",
      },
      {
        title: "Individual rehabilitation support",
        description:
          "Discuss an approach based on professional assessment, personal goals, and any relevant clinical guidance.",
      },
      {
        title: "Everyday mobility guidance",
        description:
          "Explore practical questions about moving around the home and activities that matter to you.",
      },
    ],
    audience: [
      "People exploring support with mobility or movement",
      "People seeking rehabilitation after a clinical referral",
      "Families helping someone arrange an assessment at home",
    ],
    expectation:
      "A physiotherapist would first discuss your concerns and assess what is suitable. The frequency, location, and content of sessions need individual confirmation. No specific results are guaranteed.",
    preparation: [
      "Ask whether a home visit is available in your area.",
      "Discuss any referral requirements when arranging care.",
      "Confirm access arrangements and a suitable space for the visit.",
    ],
    faqs: [
      {
        question: "Can physiotherapy take place at home?",
        answer:
          "Home visits may be an option, depending on your location, needs, and professional availability. These details have not been confirmed for this demonstration.",
      },
      {
        question: "Do I need a referral?",
        answer:
          "Referral requirements vary. Ask the provider before arranging a session, and follow advice from your treating professional.",
      },
      {
        question: "How many sessions will I need?",
        answer:
          "That can only be discussed after an appropriate assessment. This website does not prescribe exercises, treatment plans, or a number of visits.",
      },
    ],
    related: ["medical-equipment", "caretaker-services"],
  },
  {
    slug: "caretaker-services",
    title: "Caretaker Services",
    shortTitle: "Caretaker services",
    label: "Everyday support & companionship",
    description:
      "Thoughtful, non-medical assistance with daily routines, companionship, and personal care.",
    headline: "An extra hand. A familiar routine.",
    overview:
      "Sometimes the support a person needs is in the everyday: getting ready, moving around, or having someone to talk to. Caretaker services focus on non-medical assistance while respecting the person's preferences, dignity, and routines.",
    image: "/images/caregiver.jpg",
    imageAlt: "Caregiver supporting an older woman in her home",
    includes: [
      {
        title: "Daily personal assistance",
        description:
          "Discuss support with everyday routines and personal care, within an agreed non-medical role.",
      },
      {
        title: "Companionship",
        description:
          "Explore arrangements for company, conversation, and participation in familiar daily activities.",
      },
      {
        title: "Practical mobility support",
        description:
          "Ask about suitable assistance around the home, with needs and limitations agreed in advance.",
      },
    ],
    audience: [
      "Older adults looking for help with daily routines",
      "Families exploring non-medical support for a loved one",
      "People who would appreciate companionship at home",
    ],
    expectation:
      "Before care starts, the person's routine, preferences, and support needs should be discussed. Caretaker assistance is distinct from clinical nursing and does not replace a qualified healthcare professional.",
    preparation: [
      "Think about the daily activities where help would be useful.",
      "Discuss preferred visit times and household routines.",
      "Clarify the caretaker's duties and any clinical needs separately.",
    ],
    faqs: [
      {
        question: "Is a caretaker the same as a nurse?",
        answer:
          "No. A caretaker provides non-medical daily support. Clinical nursing tasks require a suitably qualified professional and a separately agreed care plan.",
      },
      {
        question: "Can I arrange overnight or ongoing support?",
        answer:
          "Hours, visit lengths, and ongoing arrangements must be confirmed with the provider. This demo does not promise overnight or round-the-clock availability.",
      },
      {
        question: "Can families help plan the routine?",
        answer:
          "A real arrangement should consider the person's wishes and consent, alongside appropriate family involvement. Responsibilities and preferences should be discussed before care begins.",
      },
    ],
    related: ["nursing-care", "physiotherapy"],
  },
  {
    slug: "medical-equipment",
    title: "Medical Equipment",
    shortTitle: "Medical equipment",
    label: "Practical support for care at home",
    description:
      "Understand home equipment categories and inquire about suitable arrangements and availability.",
    headline: "Make space for the right support.",
    overview:
      "The right equipment may support a care plan at home. Explore general categories below, then discuss suitability with a qualified professional. Specific products, supply, rental arrangements, and delivery are subject to confirmation.",
    image: "/images/equipment.svg",
    imageAlt: "Illustration of an adjustable home-care bed and a mobility aid",
    includes: [
      {
        title: "Mobility aids",
        description:
          "A category for walking and mobility support. Selection and fitting should follow appropriate professional advice.",
      },
      {
        title: "Beds & positioning support",
        description:
          "Explore equipment categories intended to support an agreed home-care arrangement and available space.",
      },
      {
        title: "Home monitoring equipment",
        description:
          "Ask about devices recommended by your treating professional and the guidance needed for their use.",
      },
    ],
    audience: [
      "Families preparing a home for an agreed care plan",
      "People advised to explore a mobility or support aid",
      "Caregivers with questions about equipment arrangements",
    ],
    expectation:
      "Equipment suitability, availability, cost, maintenance, and delivery must be confirmed before any arrangement. These categories are illustrative and do not represent an in-stock catalog.",
    preparation: [
      "Have the equipment recommendation or specification available.",
      "Check relevant room dimensions and home access.",
      "Ask about setup, training, maintenance, and return terms.",
    ],
    faqs: [
      {
        question: "Is this an equipment shop?",
        answer:
          "No. The categories illustrate a potential service. There is no live inventory, checkout, or purchasing function on this demo.",
      },
      {
        question: "Can equipment be rented?",
        answer:
          "Rental and purchase options have not been confirmed. A real provider would need to explain availability, pricing, terms, and maintenance responsibilities.",
      },
      {
        question: "How do I choose an appropriate device?",
        answer:
          "Discuss selection with a qualified professional familiar with your needs. This website does not recommend a specific device or replace professional guidance.",
      },
    ],
    related: ["physiotherapy", "nursing-care"],
  },
  {
    slug: "laboratory-services",
    title: "Laboratory Services",
    shortTitle: "Laboratory services",
    label: "Sample collection inquiries",
    description: "Ask about laboratory support and the possibility of sample collection from home.",
    headline: "Explore a simpler way to arrange testing.",
    overview:
      "When a healthcare professional recommends testing, arranging the practical details should be clear. Explore inquiries about laboratory services and home sample collection, subject to test suitability, location, and provider availability.",
    image: "/images/laboratory.svg",
    imageAlt: "Illustration of labeled sample tubes and a laboratory request sheet",
    includes: [
      {
        title: "Testing inquiries",
        description:
          "Ask whether the requested test can be arranged and which laboratory or provider would be involved.",
      },
      {
        title: "Home collection arrangements",
        description:
          "Discuss whether collection at home is appropriate, available, and supported in your area.",
      },
      {
        title: "Preparation & report information",
        description:
          "Confirm instructions, expected reporting arrangements, and how results will reach the appropriate person.",
      },
    ],
    audience: [
      "People with a test request from a healthcare professional",
      "Families arranging collection for someone at home",
      "People seeking clarity about laboratory arrangements",
    ],
    expectation:
      "The requested test, collection requirements, costs, and reporting arrangements need confirmation. No specific tests, laboratory accreditations, or turnaround times are represented by this demo.",
    preparation: [
      "Confirm the exact test request through the real provider.",
      "Follow only the preparation instructions given for that test.",
      "Ask how reports and any follow-up questions will be handled.",
    ],
    faqs: [
      {
        question: "Which tests are available?",
        answer:
          "A confirmed test list is not available in this demo. In a real inquiry, the provider would check the requested test and collection requirements before making arrangements.",
      },
      {
        question: "Do I need to fast?",
        answer:
          "Preparation depends on the specific test. Do not fast or change medication based on this website; ask your healthcare professional or the confirmed laboratory for instructions.",
      },
      {
        question: "When will results be ready?",
        answer:
          "Reporting times depend on the test and laboratory. No turnaround time is guaranteed here; confirm the expected timing and report delivery method before collection.",
      },
    ],
    related: ["online-consultation", "nursing-care"],
  },
  {
    slug: "nursing-care",
    title: "Nursing Care",
    shortTitle: "Nursing care",
    label: "Professional care in a familiar place",
    description:
      "Explore home nursing support shaped around an assessed need and an agreed care plan.",
    headline: "Thoughtful nursing support, closer to home.",
    overview:
      "Home nursing can bring professional support into familiar surroundings when clinically appropriate. The type of care, required qualifications, and visit arrangements should be agreed after reviewing the person's needs and any treating clinician's guidance.",
    image: "/images/home-care.jpg",
    imageAlt: "Care professional in conversation with an older man at home",
    includes: [
      {
        title: "Care needs discussion",
        description:
          "Explain the broad type of support being explored so a real provider can assess whether it is within their scope.",
      },
      {
        title: "Agreed nursing support",
        description:
          "Care would follow an appropriate assessment, agreed responsibilities, and any required clinical instructions.",
      },
      {
        title: "Patient & family communication",
        description:
          "Discuss practical care arrangements and how updates or concerns should be communicated, with appropriate consent.",
      },
    ],
    audience: [
      "People advised to explore nursing support at home",
      "Families planning care following a hospital stay",
      "People with an existing care plan who need to discuss home support",
    ],
    expectation:
      "Nursing care must be provided by appropriately qualified professionals. Procedures, staffing, care scope, and availability are not confirmed on this website and should be checked with the real provider.",
    preparation: [
      "Discuss the broad type of support required.",
      "Confirm professional qualifications and the proposed care scope.",
      "Agree visit arrangements and how care concerns will be handled.",
    ],
    faqs: [
      {
        question: "Which nursing procedures are offered?",
        answer:
          "No procedure list has been confirmed. A real provider must assess the request, clinical instructions, staff qualifications, and whether care at home is appropriate.",
      },
      {
        question: "How does nursing differ from caretaker support?",
        answer:
          "Nursing involves clinical responsibilities performed by qualified professionals. Caretaker services focus on non-medical daily assistance and companionship.",
      },
      {
        question: "Can I book a nurse immediately?",
        answer:
          "This is a frontend demonstration and cannot arrange care. In a real service, the request would need review and explicit confirmation before any visit is booked.",
      },
    ],
    related: ["caretaker-services", "medical-equipment"],
  },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}
