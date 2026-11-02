import type { PublicProfile, PageKey, ServiceEntry } from "@/types/profile";
import { defaultCopy } from "./content/default-copy";
import { serviceCatalog } from "@/data/service-catalog";
import { additionalServices } from "./service-templates";
import { faqGroups } from "@/data/faq-catalog";
import { benefits, steps } from "@/data/default-site-content";

const catalog = [...serviceCatalog, ...additionalServices];
function entries(
  slugs: string[],
  overrides: Partial<Record<string, Partial<ServiceEntry>>> = {},
): ServiceEntry[] {
  return catalog.map((service, index) => ({
    ...service,
    kind: service.slug === "medical-equipment" ? "equipment" : "care",
    enabled: slugs.includes(service.slug),
    order: slugs.includes(service.slug) ? slugs.indexOf(service.slug) : slugs.length + index,
    ...overrides[service.slug],
  }));
}
const pages: PublicProfile["seo"]["pages"] = {
  about: {
    title: "About home healthcare",
    description:
      "Understand the purpose and possibilities of thoughtful home healthcare for individuals and their families.",
  },
  services: {
    title: "All home health services",
    description:
      "Explore home healthcare categories, including nursing, physiotherapy, caretaker support, equipment, laboratory services, and online consultation.",
  },
  booking: {
    title: "Request an appointment — demo",
    description:
      "Try a three-step appointment request demonstration. Choose a service, review example details, and explore the care arrangement experience.",
  },
  contact: {
    title: "Contact & inquiries",
    description:
      "Explore contact options and try a demonstration inquiry form for home healthcare services.",
  },
  faq: {
    title: "Frequently asked questions",
    description:
      "Understand care options, appointment requests, service availability, and how this healthcare website demonstration handles your information.",
  },
  privacy: {
    title: "Provisional privacy policy",
    description:
      "How this demonstration handles form entries and what must be reviewed before a production launch.",
  },
};
export const defaultProfile: PublicProfile = {
  id: "default",
  businessType: "home-healthcare",
  name: "Home Health Services",
  shortName: "Home Health",
  brandLine: "SERVICES",
  fixture: false,
  tagline: "Care, in familiar surroundings.",
  description:
    "Explore home healthcare options, from nursing and physiotherapy to everyday support. A frontend demonstration of a more thoughtful care experience.",
  logo: { src: "", alt: "Home Health Services" },
  contact: { phone: "", email: "", address: "", serviceArea: "", whatsappUrl: "", mapUrl: "" },
  socialLinks: [],
  url: "",
  showTestimonials: false,
  demo: true,
  theme: "clinical-blue",
  copy: defaultCopy,
  sections: {
    about: true,
    services: true,
    whyHomeCare: true,
    howItWorks: true,
    testimonials: false,
    questions: true,
    contact: true,
    cta: true,
  },
  features: {
    whatsapp: true,
    inquiryForm: true,
    booking: true,
    serviceFAQs: true,
    relatedServices: true,
  },
  navigation: {
    main: [
      { label: "Home", href: "/" },
      { label: "About", href: "/#about", section: "about" },
      { label: "Why home care", href: "/#why-home-care", section: "whyHomeCare" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
    footer: [
      { label: "About home care", href: "/about" },
      { label: "All services", href: "/services" },
      { label: "Frequently asked questions", href: "/faq" },
      { label: "How it works", href: "/#how-it-works", section: "howItWorks" },
      { label: "Request an appointment", href: "/book-appointment" },
      { label: "Contact", href: "/contact" },
    ],
    servicesLabel: "Services",
    allServicesLabel: "All home health services",
  },
  media: {
    hero: { src: "/images/home-care.jpg", alt: defaultCopy.home_a_care_companion_reading_with_10 },
    about: { src: "/images/caregiver.jpg", alt: defaultCopy.home_a_caregiver_offering_a_steady_23 },
  },
  benefits,
  steps,
  faqGroups,
  services: entries(serviceCatalog.map((s) => s.slug)),
  seo: { homeTitle: "Care, closer to home", locale: "en_US", pages },
};

function businessProfile({
  id,
  name,
  shortName,
  businessType,
  theme,
  slugs,
  headline,
  description,
  image,
}: {
  id: string;
  name: string;
  shortName: string;
  businessType: PublicProfile["businessType"];
  theme: PublicProfile["theme"];
  slugs: string[];
  headline: [string, string, string];
  description: string;
  image: PublicProfile["media"]["hero"];
}): PublicProfile {
  const home = businessType === "home-healthcare";
  const label = home
    ? "home care"
    : businessType === "general-clinic"
      ? "clinic care"
      : "physiotherapy";
  const profilePages = Object.fromEntries(
    Object.entries(pages).map(([key, value]) => [
      key,
      {
        ...value,
        title:
          key === "services"
            ? `Explore ${label}`
            : key === "about"
              ? `About ${shortName}`
              : value.title,
        description: `${value.title} for ${name}. Fictional business configuration; appointments and contact forms are demonstrations.`,
      },
    ]),
  ) as Record<PageKey, { title: string; description: string }>;
  return {
    ...defaultProfile,
    sections: { ...defaultProfile.sections },
    features: { ...defaultProfile.features },
    id,
    name,
    shortName,
    businessType,
    theme,
    fixture: true,
    brandLine: "DEMONSTRATION",
    tagline: headline.join(" "),
    description,
    logo: { src: `/images/${id}-logo.svg`, alt: `${shortName} fictional demonstration logo` },
    contact: {
      ...defaultProfile.contact,
      email: `hello@${id}.example`,
      serviceArea: "Fictional demonstration area · No operational service locations",
    },
    socialLinks: [{ label: "Example business profile", url: `https://example.com/${id}` }],
    url: `https://${id}.example`,
    copy: {
      ...defaultCopy,
      home_compassionate_2: headline[0],
      home_healthcare_3: headline[1],
      home_closer_to_home_4: headline[2],
      home_for_the_everyday_moments_for_5: description,
      home_care_that_feels_closer_1: "FICTIONAL BUSINESS · CONFIGURATION DEMO",
      home_clinical_care_everyday_support_one_15: `${label.toUpperCase()}. CLEAR INFORMATION. ONE PLACE TO START.`,
      home_support_for_life_19: "Support for you,",
      home_at_home_20: home ? "at home." : "at your next step.",
      home_view_all_home_health_services_22: "View all services ",
      home_from_professional_care_to_everyday_18: `Explore the ${label} options shown in this fictional business demonstration.`,
      home_home_is_more_than_a_26: home
        ? "Support in the place you call home."
        : "Care starts with understanding your next step.",
      home_care_should_consider_the_person_27: `${name} is a fictional ${label} profile showing how the same application can present different businesses. No real clinicians, locations or service availability are represented.`,
      home_why_home_healthcare_30: home ? "WHY EXPLORE HOME CARE?" : "A THOUGHTFUL STARTING POINT",
      home_familiar_places_meaningful_possibilities_31: home
        ? "Familiar surroundings. Considered support."
        : "Clear options. More informed conversations.",
      home_the_right_care_arrangement_is_32: `Explore the practical questions involved in arranging ${label}, with suitability and availability confirmed by a real provider.`,
      home_here_life_feels_familiar_33: "Space for your questions.",
      home_get_to_know_home_healthcare_29: `About ${shortName} `,
      home_for_you_for_your_family_8: "For your questions. For your next step.",
      home_for_the_place_you_call_9: home
        ? "For support at home."
        : "For a more informed conversation.",
      services_all_home_health_services_1: "ALL SERVICES",
      services_a_little_support_2: home ? "A little support." : "Understand your options.",
      services_a_world_of_difference_3: "Explore a thoughtful next step.",
      faq_explore_the_questions_people_may_4: `Explore questions about ${label} and understand what this fictional demonstration can do.`,
      about_consider_the_home_environment_daily_18: home
        ? defaultCopy.about_consider_the_home_environment_daily_18
        : "Consider the visit setting, the individual's routines, and practical arrangements for patients and families.",
      shared_cta_section_looking_for_care_at_home_2: home
        ? "Looking for care at home?"
        : businessType === "physiotherapy"
          ? "Exploring movement support?"
          : "Considering a consultation?",
      layout_header_a_little_closer_to_home_1: ` ${shortName} · Fictional business example`,
      layout_header_website_demonstration_2: " Fictional brand demonstration",
      layout_header_explore_home_care_7: `Explore ${shortName}`,
      layout_header_explore_all_home_health_services_5: "Explore all services ",
      layout_footer_a_thoughtful_starting_point_for_1: `A fictional ${label} website demonstrating configurable information and appointment requests.`,
      layout_footer_temporary_branding_frontend_demonstration_2:
        "Fictional identity · Demonstration only",
      home_a_simple_introduction_to_how_38: `An introduction to how requesting ${label} could work.`,
      home_a_more_personal_care_experience_12: home
        ? "A more personal care experience."
        : "A considered approach to care.",
      home_familiar_surroundings_11: home ? "Familiar surroundings." : "Clear next steps.",
      home_discover_the_possibilities_of_home_13: `Explore ${label} options`,
      about_the_idea_behind_home_care_2: `ABOUT ${shortName.toUpperCase()}`,
      about_this_website_introduces_a_possible_9: `This fictional ${label} profile demonstrates a configurable website with structured service information and a request-first experience. It does not represent verified professionals, facilities or actual service availability.`,
      about_home_care_is_not_onesizefitsall_10:
        "Care arrangements depend on individual needs, appropriate assessment, and confirmed professional availability. A real provider must explain its services and responsibilities before an appointment is agreed.",
    },
    navigation: {
      ...defaultProfile.navigation,
      main: [
        { label: "Home", href: "/" },
        { label: "About", href: "/#about", section: "about" },
        {
          label: home ? "Why home care" : "Our approach",
          href: "/#why-home-care",
          section: "whyHomeCare",
        },
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/contact" },
      ],
      footer: defaultProfile.navigation.footer.map((link) =>
        link.href === "/about" ? { ...link, label: `About ${shortName}` } : { ...link },
      ),
      allServicesLabel: "All services",
    },
    media: { hero: image, about: image },
    services: entries(slugs),
    seo: { homeTitle: headline.join(" "), locale: "en_US", pages: profilePages },
    benefits: home
      ? benefits
      : [
          {
            title: "Understand the options",
            text: "Explore structured service information before deciding what to ask a provider.",
          },
          {
            title: "Prepare your questions",
            text: "Consider practical arrangements, appointment format and any requirements to confirm.",
          },
          {
            title: "Discuss a suitable next step",
            text: "A real professional would need to assess suitability and confirm the agreed service.",
          },
        ],
    faqGroups: faqGroups.map((group, index) =>
      index === 0
        ? {
            ...group,
            title: "Finding the right support",
            items: group.items.filter((_, i) => i !== 1),
          }
        : group,
    ),
  };
}

const clinic = businessProfile({
  id: "general-clinic",
  name: "Willow Clinic — Demo",
  shortName: "Willow Clinic",
  businessType: "general-clinic",
  theme: "clinical-blue",
  slugs: ["general-consultation", "follow-up-consultation", "laboratory-services"],
  headline: ["Clear conversations.", "Considered care,", "at your next step."],
  description:
    "A fictional clinic profile demonstrating consultation inquiries, follow-up information and laboratory-service questions. Explore the options before discussing a real arrangement.",
  image: {
    src: "/images/consultation.svg",
    alt: "Editorial illustration of a consultation; fictional clinic demonstration",
  },
});
clinic.sections.whyHomeCare = false;
clinic.features.whatsapp = false;

const homeCare = businessProfile({
  id: "home-care",
  name: "Harbor Home Care — Demo",
  shortName: "Harbor Home Care",
  businessType: "home-healthcare",
  theme: "soft-teal",
  slugs: [
    "nursing-care",
    "caretaker-services",
    "physiotherapy",
    "online-consultation",
    "laboratory-services",
  ],
  headline: ["Everyday support.", "Thoughtful care,", "in familiar places."],
  description:
    "A fictional home healthcare agency showing nursing inquiries, non-medical daily support and other care options. No real care requests are received by this demonstration.",
  image: defaultProfile.media.hero,
});
homeCare.sections.about = false;

const physio = businessProfile({
  id: "physiotherapy-center",
  name: "Stride Physiotherapy — Demo",
  shortName: "Stride Physiotherapy",
  businessType: "physiotherapy",
  theme: "warm-neutral",
  slugs: ["physiotherapy", "mobility-assessment", "rehabilitation-support"],
  headline: ["Movement matters.", "Explore support,", "one step at a time."],
  description:
    "A fictional physiotherapy centre illustrating movement assessments and rehabilitation inquiries. Professional qualifications, clinical suitability and real appointment availability remain unconfirmed.",
  image: {
    src: "/images/physiotherapy.jpg",
    alt: "Illustrative stock photograph of a physiotherapy session; not company personnel",
  },
});
physio.features.inquiryForm = false;
physio.services = entries(["physiotherapy", "mobility-assessment", "rehabilitation-support"], {
  physiotherapy: {
    overview:
      "Explore a professional conversation about movement, mobility goals and rehabilitation arrangements. Any treatment plan would require a suitable assessment and confirmed professional guidance. This fictional centre cannot offer clinical care through the demo.",
    description:
      "Explore movement and mobility support based on individual professional assessment.",
  },
});

export const profiles: Record<string, PublicProfile> = {
  default: defaultProfile,
  "general-clinic": clinic,
  "home-care": homeCare,
  "physiotherapy-center": physio,
};
export function getProfile(id = "default") {
  if (!Object.hasOwn(profiles, id)) throw new Error(`Unknown public site profile: ${id}`);
  return profiles[id];
}
