# Phase 3 public website audit and plan

Authorization: The user approved Phase 2 progression and requested Phase 3 on 2 November 2026.

The existing public site already contains a complete homepage, About, six structured service-detail routes, directory, three-step appointment UI, Contact, provisional Privacy, related services, CTAs, mobile navigation and footer. Reuse them rather than rewrite approved presentation and frontend behavior.

Identified gaps: no dedicated general FAQ route; limited general-question discovery; header wording suggests booking despite request-only semantics; a testimonial placeholder is visible without approved stories. Add a grouped FAQ route and homepage preview, link it from navigation/footer, use “Request appointment”, and hide the testimonial placeholder by default while retaining the existing configuration flag. Service-specific FAQs remain on service pages.

Verification plan: all 13 public routes and their images; all six service CTA prefills; FAQ category anchors, keyboard answers and service cross-links; contact form validation/completion/reset with no POST; booking and mobile-menu regressions; all public pages at 320, 375, 390, 430, 768, 1024 and 1440px; representative screenshots; scoped axe checks on homepage, FAQ, Contact and booking. Run lint, types, unit/component suite, production build, browser suite, and the standalone link/asset smoke check. Do not run dev and build concurrently.

Out of scope: real booking submissions, catalog administration, database, authentication, delivery notifications and Phase 4 business configurations. Company identity, service availability, contact channels, legal approvals and clinical claims remain subject to confirmation.
