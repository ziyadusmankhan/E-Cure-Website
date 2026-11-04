# E-Cure UI/UX transformation: Stage 1 audit and design mapping

Review date: 3 November 2026 (Asia/Karachi). Source checkpoint: `38c8294`.

Status: audit and baseline verification complete; implementation has not started.

## Scope and reference interpretation

The attached master prompt describes a frontend redesign and explicitly requests Stage 1 only, followed by review before UI implementation. This report follows that proposed initial scope. The attachments are design references and proposed requirements, not independent authorization to modify backend systems, publish CMS content, or deploy the application.

Reviewed the complete master prompt, all 10 pages of `C:/Users/Ziyad Usman Khan/Downloads/E-Cure_UI_UX_Design_Brief.pdf`, the supplied official logo, the two illustrated strategy sheets, and the desktop/mobile composition. The PDF was extracted in full and all ten rendered pages were visually reviewed together; its homepage composition was also inspected separately. The actual PDF has ten pages, rather than the two illustrated strategy sheets attached separately.

The written brief qualifies the mockup as illustrative. Its example telephone number, email, patient quotation, 4.9/5 rating, staff credentials, and availability are not verified business facts. None should be copied into live content. Keep genuine review content hidden until approved. Preserve request-received language rather than treating a submission as a confirmed appointment.

## Existing architecture

| Area | Observed implementation | Implication for redesign |
| --- | --- | --- |
| Framework | Next.js 16.4.2, React 19.3.1, App Router | Keep existing routes and Server Components. Reviewed installed Next.js layout, font, and image guides. |
| Type system | TypeScript 6.0.3, strict mode, `@/*` source aliases | Extend existing types only where presentation requires it. |
| Styling | Tailwind CSS 4.3.3 plus substantial custom CSS | Retain one design system; avoid a replacement framework. |
| Fonts | Lora headings, Source Sans 3 body through `next/font/google` | Introduce scoped Manrope/Inter typography for the E-Cure presentation, preserving other profiles. |
| Brand/configuration | `profiles.ts`, typed copy, theme presets, section/feature flags | Keep branding and content configurable. |
| Public content | `getPublicWebsite()` returns current published or authorized preview snapshots | Preserve published/draft distinction and dynamic rendering. |
| Reusable UI | Button/CVA, Radix navigation, dialogs and accordion, service cards, CTA, fields, tables, status badges | Improve existing components and styles. |
| Forms | React Hook Form/Zod, service preselection, review step, submission hook and Turnstile | Preserve payloads, validation, consent, pending/error states and receipt semantics. |
| Admin | Actual protected staff workspace and a separate demonstration `AdminShell` | Style the operational workspace; changing the showcase alone does not redesign admin. |
| Backend | PostgreSQL/Drizzle, local Supabase authentication/MFA, role permissions, audited management and CMS | Protected; no redesign changes proposed here. |
| Animation | CSS transitions and reduced-motion handling | Keep lightweight and respect motion preferences. |
| SEO | Profile metadata, dynamic root/service metadata, demo-aware robots and sitemap | Preserve current behavior; do not enable indexing as part of visual work. |

The README contains older roadmap wording. `docs/DEVELOPMENT_STATUS.md` identifies Phase 8 as implemented and awaiting approval; Phases 9–12 have not started. The redesign stages are separate from that platform roadmap.

## Routes and frontend inventory

Public pages: `/`, `/about`, `/services`, `/faq`, `/contact`, `/book-appointment`, `/privacy-policy`, plus the custom not-found page. `/design-system` is an opt-in demonstration route.

The shared dynamic service template at `src/app/services/[slug]/page.tsx` currently supports these six configured categories:

- `/services/online-consultation`
- `/services/nursing-care`
- `/services/physiotherapy`
- `/services/laboratory-services`
- `/services/caretaker-services`
- `/services/medical-equipment`

Service eligibility, order, related links and visibility remain data driven. Do not replace the catalog with a hardcoded six-item rendering.

Staff routes include login, MFA, overview, appointment/customer/inquiry lists and details, website editor, and access/permissions. Protected loading, error and not-found states already exist.

Shared frontend areas:

- Layout: `src/components/layout/header.tsx`, `footer.tsx`, and `src/app/layout.tsx`.
- Shared content: brand, service card/icon, CTA, headings, breadcrumbs, contact details, WhatsApp support.
- Forms: booking, contact, submission/security components and request hook.
- Staff presentation: `operations-ui.tsx`, `cms-editor.tsx`, `auth-forms.tsx`, actual admin page JSX and protected layout.
- Styles: `src/app/globals.css`, `src/styles/tokens.css`, `components.css`, `public.css`, `profiles.css`, `submissions.css`, and `admin-auth.css`.

## Current presentation compared with references

The running site at `http://127.0.0.1:3000` returns the `default` profile with `clinical-blue` styling and generic Home Health branding. Its homepage loads without observed browser runtime errors. Desktop and 390px mobile screenshots were inspected.

| Area | Current site | Planned E-Cure treatment |
| --- | --- | --- |
| Brand | Generic house/cross SVG and text lockup | Supplied official artwork on a dark surface, without recreating the mark. |
| Header/footer | White header, pale footer, blue primary action | Charcoal surfaces, balanced white text, green actions, configured contact details only. |
| Hero | Large serif headline, pale background, curved image corner and overlapping caption | Controlled sans-serif headline, dark split composition, green emphasis, relevant care photography, primary appointment request action. |
| Services | Tall cards with decorative numbering | Compact bordered icon/title/description cards; three desktop columns, two tablet columns where readable, stacked mobile list. |
| Local/company context | General home-care content | Islamabad context and approved company introduction, with no invented qualifications or premises. |
| Process | Four numbered items; two columns on small screens | Four horizontal steps on desktop and a clear vertical sequence on mobile. |
| Booking access | Desktop header CTA; smaller text action on mobile hero | Prominent mobile booking access and practical tap targets; preserve existing workflow. |
| Testimonials | Disabled by profile/section flags | Remain hidden until authentic approved reviews exist. |
| Forms | Existing validated multi-step booking/contact interfaces | Refine typography, labels, spacing, borders, errors and responsive layout. |
| Admin | Working staff screens; several hardcoded blue/grey values | Dark navigation, green selected states, compact light content, readable tables and mobile controls. |

## Integration constraints and proposed decisions

1. **Published CMS overrides configuration.** Database-mode snapshots replace brand, copy, images, sections, steps and service content. Editing `profiles.ts` alone is insufficient to rebrand an already-published database-backed site. Prepare the new presentation and an explicit content checklist first; any later content changes must use the existing authorized editor and preview flow. No direct database rewrite is required for the visual redesign.
2. **Deployment profile identity is checked against stored data.** Do not simply switch the existing installation to a new `ecure` profile ID: `readPublishedWebsite()` rejects a deployment/database profile mismatch. Model E-Cure as a configurable presentation on the existing deployment identity, preserving the generic base and fictional profiles. A separate deployment migration is outside this frontend task.
3. **CMS themes use a protected enum.** Allowed themes are `clinical-blue`, `soft-teal`, and `warm-neutral`. Avoid adding a persisted fourth theme that would require changing server validation. Use a frontend presentation variant and scoped tokens with the existing configurable primary/secondary colors. Keep existing themes functional for the other profiles.
4. **Logo paths are validated.** Static profile logos must start with `/images/`; CMS static assets are also allowlisted from the selected configuration. Use `/images/branding/` for proposed static assets rather than the master prompt's illustrative `/branding/` directory. Existing CMS uploads remain an available path for later content changes.
5. **The existing brand component assumes a square mark.** It renders a 42px image alongside company text. Adapt its presentation to accommodate supplied artwork without squashing it or duplicating the full wordmark; retain a sensible fallback for other businesses.
6. **Accent green and action green need distinct roles.** `#22C55E` has approximately 2.28:1 contrast against white; it is unsuitable for small white button labels. Use it for the logo/accent on dark surfaces and use `#147A3D` for white-labelled controls (approximately 5.41:1). Validate focus, hover and disabled combinations as implementation proceeds.
7. **SEO editing is not an existing admin feature.** The PDF lists it as a desired module, while the current CMS intentionally excludes advanced SEO editing. Preserve existing frontend metadata; report dashboard SEO editing as outside this redesign rather than adding a backend feature.
8. **Operational states must remain truthful.** Current deployment uses demonstration/local-test behavior in several places. Do not turn it into live service through branding changes or imply messages are delivered, care is confirmed, or payments/notifications exist.

## Asset and content audit

| Asset | Availability | Planned handling |
| --- | --- | --- |
| Official logo | Supplied JPEG, 688 × 1532px, black background, no alpha | Retain original; create a separately cropped, proportionate derivative for dark surfaces during the approved asset stage. Do not automatically remove its background or redraw it. |
| Strategy references | Two PNG sheets, each 1055 × 1491px | Design guidance, not website image assets. |
| Desktop/mobile composition | PNG, 1448 × 1086px | Layout reference; do not embed the entire mockup as a live webpage. |
| Existing care photos | `home-care.jpg`, `caregiver.jpg`, `physiotherapy.jpg` | Reusable illustrative imagery with recorded source credits. |
| Existing illustrations | Consultation, equipment, laboratory SVGs | Reuse where relevant or improve existing vectors in the presentation stage. |
| Separate mockup hero photograph | Not supplied as a standalone asset | Use appropriate existing photography initially; obtain approved replacement photography if exact reference imagery is required. |
| Islamabad photograph | Not present as a standalone approved asset | Optional; do not crop the mosque thumbnail from the mockup or present it as company premises. |

Unverified business information: actual phone, WhatsApp number, email, address, office hours, detailed coverage, confirmed service availability, qualifications, clinical claims, pricing, genuine reviews, social links, final domain, and final legal/booking terms. Islamabad is provided as the company location, but it does not establish coverage of every area. Missing details do not block the design; hide unavailable actions or retain clear existing unconfigured states.

## File change classification and implementation plan

No UI implementation files were modified in Stage 1. The anticipated changes below are a reviewable plan, not applied edits.

| Stage | Frontend-safe scope | Files requiring close integration review | Acceptance checks |
| --- | --- | --- | --- |
| 2: tokens and shared branding | Scoped E-Cure styles; supplied logo derivatives under `public/images/branding/`; header, footer, brand, buttons, fields, service cards | `src/config/profiles.ts`, optional `src/config/branding.ts`, `src/types/profile.ts`, `src/app/layout.tsx`, global CSS imports; retain CMS snapshots and feature flags | Lint, types, unit tests, production build, other-profile regressions, contrast, dropdown and modal keyboard behavior, eight target widths. |
| 3: public website | Homepage composition; About, Services, shared service template, FAQ, booking/contact visual styling, CTA and contact presentation | Existing server-page data calls, `src/components/forms/booking-form.tsx`, `contact-form.tsx`, profile copy/media and metadata integration | All public routes, assets, correct service preselection, same request payloads/receipts, validations, keyboard flows, accessibility, all target widths. |
| 4: admin appearance | CSS, operational tables/filters/cards, empty/loading/error states, responsive navigation | JSX in `src/app/admin/(protected)/layout.tsx`, protected pages, `operations-ui.tsx`, `cms-editor.tsx`, `auth-forms.tsx`; preserve every guard, role check and action | Existing authorization/management regressions in disposable test environments; staff desktop/mobile visual checks; no real-record changes. |
| 5: final QA | Focused visual fixes and documentation | Existing frontend test expectations where copy/layout legitimately changes | Production build; full relevant regression suite; eight-width QA; scoped WCAG 2.2 AA checks; indexing/metadata preservation. |

Protected paths: `src/app/api/**`, `src/server/**`, `src/proxy.ts`, `drizzle/**`, `supabase/**`, environment files, database/auth/setup scripts and any billing/notification behavior. No changes are planned to endpoint contracts, persistence, session handling, MFA, permissions, service eligibility, audit logging, migrations, rate limits, idempotency or Turnstile verification. Shared validation and submission hooks should remain unchanged; visual form edits must preserve their integration.

Specifically preserve booking fields `service`, `name`, `phone`, `email`, `date`, `time`, and `inquiry`, plus `visitMode`, consent, honeypot and Turnstile values. Inquiry display labels map to canonical topic values before submission; restyling must not break that mapping. Both forms use the existing submission hook with an `Idempotency-Key` and require valid `new` receipts. Keep these behaviors and the current error/retry handling intact.

## Baseline verification

| Check | Result and scope |
| --- | --- |
| `npm.cmd run lint` | PASS. |
| `npm.cmd run typecheck` | PASS. |
| `npm.cmd test` | PASS: 5 files, 34 tests. Existing Vite plugin/performance advisories are informational. |
| `npm.cmd run test:boundaries` | PASS: 22 client roots, 47 source modules, 27 browser bundles; no secrets printed. This verifies the existing production browser bundles, not a newly redesigned build. |
| Current production server read-only browser audit | PASS: 13 public routes returned 200 with exactly one main H1; 104 page/viewport combinations had no horizontal overflow; no observed page runtime errors. |
| Mobile navigation on current server | PASS at 390px: opens, Escape closes, focus returns to trigger, service navigation closes menu. |
| Production build of unchanged checkpoint in isolated copy | PASS, including TypeScript and generation of 12 static outputs. A multiple-lockfile/root-inference warning appeared because of the nested audit copy. Existing server and its build directory were left in place. |
| `npm.cmd run test:e2e` | PASS: all 13 Chromium tests in 1.6 minutes, using the isolated production build and disabled submission/auth/CMS modes. Covered public routes/assets, three existing themes, preview booking/contact flows, service preselection, FAQ links, mobile menus, keyboard interactions, reduced motion, scoped accessibility and unavailable-auth/API behavior. |
| Real database-backed submissions, Supabase MFA/login and authenticated management | NOT TESTED in this audit. No real records or credentials were used. Prior phase reports are historical evidence, not a new pass. |
| Three-profile independent build matrix / Lighthouse | NOT TESTED in this audit. |

Responsive coverage: 320, 375, 390, 430, 768, 1024, 1280, and 1440px. These automated overflow checks cover all thirteen public routes. Visual screenshot inspection covered the current homepage at 390 and 1440px; this is not a claim of manual visual inspection of every page at every width. The current mobile process remains a two-column composition and the menu lists all services rather than using the proposed expandable service section; these are mapped redesign changes, not test failures.

Local audit screenshots, raw results, helper script and isolated build are under ignored `.local/ecure-design-audit/`. The isolated build uses the unchanged Git checkpoint and shared installed dependencies, without copying local secrets or database configuration.

## Preservation and next review

Protected backend files were not modified. No application implementation changes, CMS publication, database mutation, environment edits, dependency upgrades, deployment or new platform phase were performed. The original untracked master prompt and `ChatGPT Image Oct 29, 2026, 08_24_09 PM.png` were preserved.

The proposed next scope is Stage 2: prepare the official logo for actual header/footer use, add the E-Cure presentation tokens and typography, and refine shared components and responsive navigation. Stage 3 public page composition and Stage 4 staff redesign remain separate review stages.

The attached master prompt states: "Do not begin editing the UI until the Stage 1 audit is approved." Review this plan before advancing to Stage 2; no backend change is needed for the proposed visual approach.
