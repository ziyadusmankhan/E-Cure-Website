import type { PublicProfile } from "@/types/profile";
import { ecureCopy, ecureFAQGroups } from "./content/ecure-copy";

const servicePresentation: Record<string, { order: number; description: string; headline: string }> = {
  "online-consultation": { order: 0, description: "Explore a consultation from the comfort of home.", headline: "A conversation about care, from home." },
  "nursing-care": { order: 1, description: "Explore nursing support for individual care needs.", headline: "Nursing support in familiar surroundings." },
  physiotherapy: { order: 2, description: "Explore support for movement, mobility and recovery.", headline: "Physiotherapy, closer to home." },
  "laboratory-services": { order: 3, description: "Ask about tests and home sample collection.", headline: "Explore laboratory services from home." },
  "caretaker-services": { order: 4, description: "Consider support with everyday routines at home.", headline: "Everyday support, with a personal touch." },
  "medical-equipment": { order: 5, description: "Explore equipment options for care at home.", headline: "Medical equipment for home care." },
};

export const ecureAssets = {
  logo: "/images/branding/ecure-official-logo.jpg",
  mark: "/images/branding/ecure-official-icon.png",
  icon: "/images/branding/ecure-official-icon.png",
} as const;

export const ecurePhotography = {
  sampleCollection: {
    src: "/images/ecure/home-sample-collection.png",
    alt: "A healthcare professional collecting a blood sample during a home visit",
  },
  panorama: { src: "/images/ecure/islamabad-panorama.jpg", alt: "A panoramic view of Islamabad and Faisal Mosque" },
  home: { src: "/images/ecure/home-care-companion.png", alt: "A caregiver beside an older woman holding a walking stick at home" },
  nursing: { src: "/images/ecure/nursing-at-home.png", alt: "A nurse checking a woman's blood pressure beside her bed at home" },
  caretaker: { src: "/images/ecure/home-care-companion.png", alt: "A caregiver supporting an older woman holding a walking stick at home" },
  physiotherapy: { src: "/images/ecure/physiotherapy-treatment.jpg", alt: "A healthcare professional assisting with a supported leg stretch on a treatment table" },
  equipment: {
    src: "/images/ecure/medical-equipment-home.png",
    alt: "An adjustable medical bed, oxygen concentrator and suction machine set up at home",
  },
  consultation: { src: "/images/ecure/online-consultation.jpg", alt: "A person discussing a medication container during an online video consultation" },
} as const;

const photoDefaults: Record<string, { sources: string[]; photo: { src: string; alt: string } }> = {
  about: {
    sources: ["/images/caregiver.jpg", "/images/ecure/islamabad-landmark.jpg"],
    photo: ecurePhotography.sampleCollection,
  },
  home: { sources: ["/images/home-care.jpg"], photo: ecurePhotography.home },
  "nursing-care": { sources: ["/images/home-care.jpg"], photo: ecurePhotography.nursing },
  "caretaker-services": { sources: ["/images/caregiver.jpg"], photo: ecurePhotography.caretaker },
  physiotherapy: { sources: ["/images/physiotherapy.jpg", "/images/ecure/physiotherapy-support.jpg"], photo: ecurePhotography.physiotherapy },
  "medical-equipment": {
    sources: ["/images/equipment.svg", "/images/ecure/medical-equipment.jpg"],
    photo: ecurePhotography.equipment,
  },
  "online-consultation": { sources: ["/images/consultation.svg"], photo: ecurePhotography.consultation },
  "laboratory-services": {
    sources: ["/images/laboratory.svg", "/images/ecure/laboratory-services.jpg"],
    photo: ecurePhotography.sampleCollection,
  },
};

// Saved CMS drafts may still contain the previous static image paths.
export const ecureLegacyPhotoPaths = [
  ...new Set(Object.values(photoDefaults).flatMap(({ sources }) => sources)),
];

// Resolve only known source defaults; uploaded or published custom media wins.
export function clientPhoto(presentation: PublicProfile["presentation"], media: { src: string; alt: string }, usage: string) {
  const replacement = Object.hasOwn(photoDefaults, usage) ? photoDefaults[usage] : undefined;
  return presentation === "ecure" && replacement?.sources.includes(media.src)
    ? replacement.photo
    : media;
}

// Display framing trims only the JPEG's white margins; its pixels stay intact.
export const ecureLogo = {
  width: 1536,
  height: 1024,
  frame: { left: 110, top: 115, width: 1320, height: 680 },
  legacySources: ["/images/branding/ecure-logo.webp"],
} as const;

export function brandArtwork(site: Pick<PublicProfile, "presentation" | "logo">) {
  const official = site.presentation === "ecure" &&
    (site.logo.src === ecureAssets.logo || ecureLogo.legacySources.some(src => src === site.logo.src));
  return { src: official ? ecureAssets.logo : site.logo.src, official };
}

// This is a presentation preset on the existing deployment identity. Keeping
// the profile ID preserves its database/CMS association and service history.
export function withEcureBranding(base: PublicProfile): PublicProfile {
  return {
    ...base,
    presentation: "ecure",
    name: "E-Cure Home Health Services",
    shortName: "E-Cure",
    brandLine: "HOME HEALTH SERVICES",
    logo: { src: ecureAssets.logo, alt: "E-Cure Home Health Services" },
    contact: {
      ...base.contact,
      phone: "+92 3394838347",
      secondaryPhone: "+92 3394837347",
      email: "ecurehomes@gmail.com",
      address: "Mehboob Market, Service Road West, Street 5, F-12, Islamabad",
      serviceArea: "Islamabad, Pakistan",
      whatsappUrl: "https://wa.me/923394838347",
    },
    features: { ...base.features, booking: false, inquiryForm: false },
    faqGroups: ecureFAQGroups,
    description: "Explore home healthcare services in Islamabad, including nursing, physiotherapy, caretaker support, laboratory services, equipment and online consultation.",
    media: {
      hero: clientPhoto("ecure", base.media.hero, "home"),
      about: clientPhoto("ecure", base.media.about, "about"),
    },
    services: base.services.map((service) => {
      const photo = clientPhoto("ecure", { src: service.image, alt: service.imageAlt }, service.slug);
      return { ...service, ...servicePresentation[service.slug], image: photo.src, imageAlt: photo.alt };
    }),
    benefits: [
      { title: "Familiar surroundings", text: "Consider support that fits your home environment and everyday routine." },
      { title: "A personal conversation", text: "Discuss your needs, preferences and practical questions before making arrangements." },
      { title: "Clear next steps", text: "Confirm suitability, timing, fees and the scope of care before an appointment begins." },
    ],
    steps: [
      { title: "Contact E-Cure", text: "Choose a service, then call, email or message us on WhatsApp." },
      { title: "Discuss your needs", text: "Talk through the support you are looking for and ask your questions." },
      { title: "Confirm arrangements", text: "Agree on suitability, availability and practical details with the team." },
      { title: "Receive care", text: "Care begins once the service and appointment arrangements are confirmed." },
    ],
    seo: {
      ...base.seo,
      homeTitle: "Home care in Islamabad",
      locale: "en_PK",
      pages: {
        ...base.seo.pages,
        about: { title: "About E-Cure", description: "Learn about E-Cure Home Health Services and a personal approach to arranging care in Islamabad." },
        services: { title: "Home healthcare services in Islamabad", description: "Explore nursing, physiotherapy, caretaker services, laboratory services, medical equipment and online consultation in Islamabad." },
        booking: { title: "Request an appointment", description: "Choose a home healthcare service, enter your contact details and review an appointment request with E-Cure, Islamabad." },
        contact: { title: "Contact E-Cure", description: "Call, email or message E-Cure on WhatsApp to discuss home healthcare in Islamabad." },
        faq: { title: "Frequently asked questions", description: "Find answers about home healthcare services and how to arrange care with E-Cure." },
        privacy: { title: "Privacy notice", description: "Information about contacting E-Cure and visiting this website." },
      },
    },
    copy: {
      ...base.copy,
      ...ecureCopy,
      layout_header_a_little_closer_to_home_1: "Islamabad, Pakistan",
      layout_header_explore_home_care_7: "E-Cure navigation",
      layout_footer_a_thoughtful_starting_point_for_1:
        "Explore home healthcare services for patients and families in Islamabad, Pakistan.",
      layout_footer_temporary_branding_frontend_demonstration_2:
        "Website preview · Service arrangements require confirmation.",
      layout_footer_explore_3: "Quick links",
      layout_footer_lets_connect_11: "Contact us",
      layout_footer_provisional_privacy_policy_17: "Privacy notice",
    },
    navigation: {
      ...base.navigation,
      main: [
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about", section: "about" },
        { label: "Why Choose Us", href: "/#why-home-care", section: "whyHomeCare" },
        { label: "Contact", href: "/contact" },
      ],
    },
  };
}
