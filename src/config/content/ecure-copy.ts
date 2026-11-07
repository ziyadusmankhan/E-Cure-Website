import type { PublicCopy } from "./default-copy";
import { faqGroups, type FAQGroup } from "@/data/faq-catalog";

// Existing copy keys keep published CMS documents and the editor compatible.
export const ecureCopy = {
  home_care_that_feels_closer_1: "HOME HEALTHCARE IN ISLAMABAD",
  home_compassionate_2: "Compassionate",
  home_healthcare_3: "Care",
  home_closer_to_home_4: "at Home",
  home_for_the_everyday_moments_for_5:
    "Home healthcare services for patients and families in Islamabad, Pakistan. Explore care and support in the comfort of your home.",
  home_explore_our_services_6: "Explore Our Services",
  home_request_an_appointment_7: "Contact for Booking",
  home_for_you_for_your_family_8: "For you and your family.",
  home_for_the_place_you_call_9: "In the place you call home.",
  home_familiar_surroundings_11: "Care at your doorstep",
  home_a_more_personal_care_experience_12: "Your needs come first",
  home_discover_the_possibilities_of_home_13: "Islamabad, Pakistan",
  home_care_imagery_for_illustration_14: "Illustrative care photography",
  home_clinical_care_everyday_support_one_15: "A more personal approach to care at home.",
  home_different_needs_thoughtful_care_17: "Home healthcare, around your needs",
  home_from_professional_care_to_everyday_18:
    "Find the support that fits your needs. Explore services and discuss the next step with the team.",
  home_not_sure_where_to_start_21: "Need help choosing a service?",
  home_view_all_home_health_services_22: "View all services",
  home_a_more_personal_approach_25: "ABOUT E-CURE",
  home_home_is_more_than_a_26: "Care starts with understanding.",
  home_care_should_consider_the_person_27:
    "Every family has different needs. E-Cure brings home healthcare options together so you can understand your choices and make informed arrangements.",
  home_whether_youre_considering_help_for_28:
    "Start with a conversation about the person, the home environment and the support you are looking for.",
  home_get_to_know_home_healthcare_29: "Get to know E-Cure",
  home_why_home_healthcare_30: "WHY CHOOSE E-CURE?",
  home_familiar_places_meaningful_possibilities_31: "Your home. Your routine. Your care.",
  home_the_right_care_arrangement_is_32:
    "A thoughtful starting point for patients, families and caregivers in Islamabad.",
  home_a_clearer_way_forward_36: "HOW IT WORKS",
  home_from_a_question_to_a_37: "A simple, clear process",
  home_a_simple_introduction_to_how_38:
    "From your first question to making arrangements, take it one step at a time.",
  home_try_the_journey_this_demo_40:
    "An appointment request starts a conversation. Care begins only after arrangements are confirmed.",
  home_helpful_to_know_45: "HERE TO HELP",
  home_a_few_questions_answered_46: "A little clarity before you begin",
  home_understand_your_options_before_taking_47:
    "Learn about service options, requests and what to expect before taking the next step.",
  home_start_a_conversation_49: "CONTACT E-CURE",
  home_lets_talk_about_what_you_50: "Let’s talk about your needs",
  home_explore_your_options_ask_a_51:
    "Call, email or message us on WhatsApp to ask a question or arrange a service.",
  about_the_idea_behind_home_care_2: "ABOUT E-CURE",
  about_care_belongs_in_3: "Care for you.",
  about_the_story_of_everyday_life_4: "Comfort for your family.",
  about_people_have_routines_favourite_places_5:
    "Home healthcare starts with understanding the person, their routine and the people who support them.",
  about_our_proposed_approach_7: "A PERSONAL APPROACH",
  about_see_the_person_understand_the_8: "See the person. Understand the need.",
  about_this_website_introduces_a_possible_9:
    "E-Cure Home Health Services introduces care options for patients and families in Islamabad. Explore nursing, physiotherapy, everyday support and other home healthcare services in one place.",
  about_home_care_is_not_onesizefitsall_10:
    "The right arrangement depends on individual needs, suitability and availability. Discuss what support involves and who will provide it before confirming care.",
  about_principles_that_guide_the_experience_11: "WHAT MATTERS TO US",
  about_simple_ideas_thoughtfully_considered_12: "A considered approach to every conversation",
  about_a_note_about_this_demonstration_19: "BEFORE MAKING ARRANGEMENTS",
  about_a_foundation_for_a_real_20: "Clear information. Informed choices.",
  about_the_final_company_identity_and_21:
    "A good care arrangement begins with practical questions. Discuss these details with the team before your appointment is confirmed.",
  about_our_story_mission_22: "Your care needs",
  about_the_companys_history_and_approved_23:
    "Explain the support you are looking for and ask which service may be suitable. A general inquiry is a starting point, not a clinical assessment.",
  about_the_people_behind_the_care_24: "The person providing care",
  about_verified_team_profiles_and_relevant_25:
    "Ask who will provide your selected service and about the qualifications relevant to that role.",
  about_our_service_locations_26: "Your location in Islamabad",
  about_confirmed_areas_and_local_arrangements_27:
    "Confirm whether your address can be served and discuss any practical requirements for a visit.",
  about_professional_credentials_28: "Timing, fees and expectations",
  about_applicable_registrations_and_independently_verified_29:
    "Agree on availability, service scope, fees and any preparation before care is arranged.",
  services_all_home_health_services_1: "OUR SERVICES",
  services_a_little_support_2: "Home healthcare.",
  services_a_world_of_difference_3: "A more personal choice.",
  services_every_care_journey_is_different_4:
    "Explore care and support options for patients and families in Islamabad. Each service page explains what to consider and how to make a request.",
  services_explore_your_care_options_5: "Find the support you need",
  services_these_categories_describe_potential_care_7:
    "Suitability, service scope, location, fees and availability are discussed before any care is confirmed.",
  service_availability: "Suitability and availability are confirmed before care is arranged.",
  service_includes_title: "What the service may include",
  service_equipment_title: "Equipment options for your needs",
  service_audience_title: "Understanding your needs",
  service_expect_title: "Know what to expect",
  service_step_one: "Call, email or message E-Cure",
  service_step_two: "Tell us what support you need",
  service_step_three: "Discuss the arrangements",
  service_faq_title: "Your questions, answered",
  service_related_title: "Explore other services",
  contact_lets_start_with_a_conversation_1: "CONTACT E-CURE",
  contact_a_question_is_2: "How can we",
  contact_a_good_place_to_begin_3: "help your family?",
  contact_whether_youre_exploring_options_for_4:
    "Call, email or message us on WhatsApp to ask about services, availability or equipment orders in Islamabad.",
  contact_real_contact_details_and_service_6:
    "Choose the contact method that works for you. Our team will discuss availability and confirm arrangements directly.",
  contact_try_the_appointment_experience_8: "Take the next step",
  book_appointment_a_little_closer_to_care_1: "APPOINTMENT REQUEST",
  book_appointment_lets_find_your_2: "Care begins with",
  book_appointment_next_step_3: "a conversation.",
  book_appointment_a_few_simple_details_are_4:
    "Choose a service, share your contact details and review your request. An appointment is confirmed separately after discussing your needs and availability.",
  book_appointment_care_starts_with_listening_5: "Your needs. A thoughtful next step.",
  book_appointment_a_safe_space_to_explore_6: "Before you begin",
  faq_helpful_to_know_1: "FREQUENTLY ASKED QUESTIONS",
  faq_a_little_clarity_2: "Your questions.",
  faq_a_more_confident_next_step_3: "Clear answers.",
  faq_explore_the_questions_people_may_4:
    "Understand home healthcare options and how to arrange a service with E-Cure.",
  faq_for_a_general_inquiry_explore_12:
    "For a general inquiry, contact E-Cure by phone, email or WhatsApp.",
  shared_cta_section_lets_find_your_next_step_1: "LET’S TAKE THE NEXT STEP",
  shared_cta_section_looking_for_care_at_home_2: "Looking for home healthcare in Islamabad?",
  shared_cta_section_explore_the_options_and_share_3:
    "Explore your options and start a conversation about the support you need.",
  shared_cta_section_request_an_appointment_4: "Contact for Booking",
} satisfies Partial<PublicCopy>;

export const ecureFAQGroups: FAQGroup[] = [
  {
    ...faqGroups[0],
    items: [
      {
        question: faqGroups[0].items[0].question,
        answer: "Explore our services, then contact E-Cure to discuss which options may suit your needs.",
      },
      faqGroups[0].items[1],
      {
        question: "Are all services available in my area?",
        answer: "Contact E-Cure with your area in Islamabad so the team can check coverage and availability.",
      },
      {
        question: "Can I ask about services for a family member?",
        answer: "Yes. Contact the team to discuss general options and consider your family member’s preferences and consent before sharing personal details.",
      },
    ],
  },
  {
    id: "appointment-requests",
    title: "Arranging a service",
    description: "How to contact the team and confirm your arrangements.",
    items: [
      {
        question: "How do I book a service or order equipment?",
        answer: "Call, email or message E-Cure on WhatsApp. Tell the team which service or equipment you need so they can discuss the next step with you.",
      },
      {
        question: "When is an appointment or order confirmed?",
        answer: "The E-Cure team confirms the timing, availability and arrangements directly with you.",
      },
      {
        question: "Where can I find prices and payment information?",
        answer: "Ask E-Cure about fees and payment arrangements for your selected service or equipment before confirming.",
      },
    ],
  },
];
