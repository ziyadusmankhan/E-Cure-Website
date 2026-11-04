# E-Cure blue-and-green branding — Stage 1 audit

Date: 4 November 2026. Scope: repository audit, asset verification, design mapping and baseline checks only. Stage 2 is awaiting explicit user approval. No redesigned UI or asset has been installed or deployed by this stage.

## Source of direction

The user's updated client-branding request and supplied official blue/green logo supersede the previous predominantly black/green brief wherever they conflict. The composite desktop/mobile reference is a visual guide. Its example phone number, email, social links, staff-verification statements and other business claims are not verified client data and must not be copied into the application.

Use the actual supplied logo, not a recreated house/hand/cross illustration. Preserve its blue/green artwork and proportions. Keep Islamabad, Pakistan as the verified service-area wording. Existing approved client/CMS data takes precedence over invented replacement content.

## Repository baseline and boundaries

- Existing app: Next.js 16.4.2 App Router, React 19.3.1, TypeScript 6.0.3, Tailwind 4.3.3, Radix navigation dialogs/accordion, Lucide care icons, React Hook Form/Zod and Sharp.
- Root `AGENTS.md` was read. Installed Next.js guides for CSS and image optimization were consulted under `node_modules/next/dist/docs/01-app/01-getting-started/`.
- There are extensive pre-existing uncommitted changes from earlier design, cleanup and deployment work. They were preserved. This audit uses a fresh file-hash baseline instead of attributing the whole Git diff to Stage 1.
- Initial hashes cover 211 application, asset, test, maintenance and deployment/config files. The protected subset contains 64 backend/API/proxy/database/Supabase/local-environment files. Baseline and reference copies are in ignored `.local/ecure-bluegreen-stage1/`.
- Do not edit `src/server/**`, `src/app/api/**`, `src/proxy.ts`, `drizzle/**`, `supabase/**`, database/auth/submission scripts or environment credentials for this redesign. Preserve API contracts, validation, request processing, role checks, MFA and sessions.
- No backend change appears necessary for the requested presentation. If implementation reveals an unavoidable one, document it and obtain explicit approval before doing it.
- The Oracle deployment remains on its current design. This audit does not publish a redesign, change its Caddy/TLS setup, configure production Auth or activate real submissions.

## Supplied assets

Exact, unmodified copies were retained under `.local/ecure-bluegreen-stage1/references/`; no originals were altered and no assets were added to `public/`.

| Asset | Original dimensions | Size | Proposed role |
| --- | --- | --- | --- |
| Official logo, image 5 | 1536 × 1024 JPEG | 70,901 bytes | Header, footer and staff brand; identity source for client favicon |
| Desktop/mobile style reference, image 2 | 1536 × 1024 PNG | 1,817,336 bytes | Layout/color direction only; not a page background or a source of contact/credential claims |
| Islamabad landmark, image 1 | 4936 × 3438 JPEG | 1,714,419 bytes | About/location section, with intentional responsive framing |
| Physiotherapy support, image 3 | 6720 × 4480 JPEG | 2,216,639 bytes | Physiotherapy/service imagery; illustrative care, not a staff identity |
| Islamabad panorama, image 4 | 6343 × 4228 JPEG | 2,435,069 bytes | Optional locality banner; its large sky area needs deliberate crop selection |

The official logo has an opaque white background and generous white margins. It is not a transparent 540 × 148 horizontal lockup like the old deployed asset. Do not stretch it to the old ratio. Stage 2 must establish a readable, proportionate image slot or source-preserving tight framing while retaining the full supplied original. Do not recolor, redraw, generate substitute artwork or remove brand elements. White logo surfaces suit the new navigation; any selected navy staff/footer surface needs a white logo area.

The new photos can be prepared as appropriately sized local assets in the implementation stages. Keep the supplied originals intact and avoid shipping multi-megapixel originals as ordinary unoptimized page images. Do not extract the synthetic-looking care image from the composite mockup; existing suitable healthcare photography can remain where the new attachments do not supply a fitting replacement.

Official-logo SHA-256: `5b1a874e6bbc81cd1fb3c085d05eaacf38ae39bc670604beff4eccff4367814b`.

## Current frontend architecture

`src/config/profiles.ts` applies `withEcureBranding()` only to the default E-Cure deployment. Its persisted profile ID remains `default`. Other profiles (`general-clinic`, `home-care`, `physiotherapy-center`) retain their own presentation. The frontend-only `presentation: "ecure"` selector already provides the right isolation boundary; a new persisted theme enum or database migration is unnecessary.

`src/app/layout.tsx` exposes `data-profile`, `data-theme` and `data-presentation`. E-Cure already receives Manrope and Inter through `next/font`; alternate profiles retain their Lora/Source Sans setup. Do not replace fonts globally.

`WebsiteProvider` and `WebsitePage` carry request snapshots into persistent navigation and page content. They also apply the existing primary/secondary CMS color overrides. Preserve their update behavior and the current DTO shape.

The read-only inspection of `src/server/cms/public.ts` confirms that published CMS brand, logo, copy, imagery and service entries override source defaults. The E-Cure presentation survives through the base profile. Therefore source-only changes must be checked both with fallback content and with an existing CMS publication: an old published logo/color override can intentionally win. Use the existing editor/draft/publish workflow for a later approved content update; do not force-reset client data or modify the backend projection to implement a color change.

## Findings that implementation must address

| Finding | Consequence | Planned response |
| --- | --- | --- |
| E-Cure CSS sets both `--blue` and `--green` to `#147a3d` | Brand roles are currently collapsed into one green | Introduce distinct E-Cure blue, navy, brand-green and accessible-action roles within the existing client skin |
| Header, drawer, hero, inner-page intros, about band, footer and staff sidebar use hard-coded black/charcoal backgrounds | A token-only swap will leave significant parts of the old design | Update the actual E-Cure component rules as well as shared tokens; use white/off-white primarily and selected navy surfaces |
| `Brand` identifies a wide logo by equality with one asset URL and supplies old 540:148 dimensions | The new JPEG and CMS-custom logos need different sizing | Keep the reusable Brand component, review its presentational sizing and make official-logo handling client-configurable without changing CMS/API fields |
| `src/app/icon.ts` serves the previous E-Cure PNG | Browser tab branding would remain outdated | Derive a client icon from the supplied official artwork in Stage 2; preserve the platform icon for other profiles |
| Some admin stylesheet selectors are broad, including `body:has(.admin-area)` and unscoped staff selectors | A careless admin color change could affect other clients | Scope new E-Cure visual rules and preserve common operational layout/semantics |
| CMS can override the source logo, brand colors, copy and photos | A disabled-CMS preview alone cannot prove published content is updated | Explicitly compare fallback and CMS-published presentations at the relevant later stage; preserve owner-controlled content |
| Forms contain real validation, consent, anti-bot, idempotency and submission state | Rebuilding form components to match the mockup risks regressions | Prefer existing CSS/markup hooks; keep form logic, field names, service eligibility, consent, request semantics and error/status behavior |
| Service listings/navigation use the snapshot's enabled services | Six hard-coded cards would break service management | Preserve `.map()` over the current catalog and existing unknown/new-service behavior |
| Branding test asserts the old 540:148 aspect ratio | It will correctly require revision when the asset changes | Update the asset/proportion assertion in Stage 2; retain real loading, responsive and navigation assertions |

## Proposed token roles and measured contrast

These are proposed implementation values, not changes made by Stage 1. Ratios below were calculated from the supplied hex values using relative luminance and are displayed rounded to two decimal places. Actual assertions should compare unrounded ratios against thresholds.

| Role/color | Against white | Against off-white `#F4F8FB` | Intended use |
| --- | --- | --- | --- |
| Navy `#0B325F` | 12.84:1 | 12.02:1 | Headings, navigation, selected dark surfaces |
| Primary blue `#075A9E` | 7.08:1 | 6.63:1 | Links, focus cues, important care icons |
| Secondary blue `#1376B9` | 4.86:1 | 4.55:1 | Supporting accents/text with care over exact surface |
| Brand green `#329B32` | 3.58:1 | 3.35:1 | Brand accent, meaningful icons, suitably large heading accents |
| Dark green `#247D29` | 5.20:1 | 4.87:1 | Proposed booking-button base with white text; darker hover state |
| Body text `#34465A` | 9.68:1 | 9.06:1 | Body content and secondary navigation |
| Light border `#DFE7ED` | 1.25:1 | 1.17:1 | Restrained decorative separators, not a sole necessary control boundary |

Use dark green rather than `#329B32` for small white booking-button labels. Normal text needs 4.5:1, while large text has a 3:1 threshold; the actual logo is exempt, so its official artwork should remain unchanged. [W3C text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

Necessary control boundaries, focus cues and meaningful non-text indicators need adequate contrast against their adjacent surface. The light border is suitable for decorative card separation; inputs or state cues that depend on a border need a stronger token. Preserve textual errors/statuses instead of relying on color alone. [W3C non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

## Component and route mapping

Paths below are relative to the repository. They identify the proposed change surface, not edits already made.

| Surface | Existing files | Planned presentation change | Preserve |
| --- | --- | --- | --- |
| Client identity/tokens | `src/config/branding.ts`, `src/styles/ecure.css` | Official logo references; separate blue/green roles; white surfaces; accessible action/focus colors | Profile ID, base profiles, feature flags and CMS color precedence |
| Fonts/root integration | `src/app/layout.tsx`, `src/components/website-provider.tsx` | Reuse existing Manrope/Inter and presentation hooks; change only if an actual presentation integration requires it | Metadata retrieval, snapshot refresh, server calls and alternate-profile fonts |
| Logo/favicon | `src/components/shared/brand.tsx`, `src/app/icon.ts`, `public/images/branding/` | Official artwork with correct sizing, white backing where needed and a source-derived E-Cure icon | Home destination, accessible brand label and non-E-Cure fallback icon |
| Public navigation | `src/components/layout/header.tsx`, `services-menu.tsx`, E-Cure CSS | White desktop header, navy links, blue/green active/focus states, deliberate compact mobile composition | Existing service disclosure, modal focus trap, Escape, scroll lock, resize closure and conditional real phone link |
| Footer/shared CTA | `src/components/layout/footer.tsx`, `src/components/shared/cta-section.tsx`, E-Cure CSS | Light or selected navy treatment, readable official logo, navy hierarchy and green CTA | Dynamic service/footer links, only configured contacts/social URLs, privacy link and preview notices |
| Homepage `/` | `src/app/page.tsx`, `src/config/content/ecure-copy.ts`, `src/styles/ecure-public.css` | Light hero with exact heading “Compassionate Care at Home”; photo, booking CTA, compact white service cards, care-request process and Islamabad context | Dynamic services, section flags, real configured copy, CTA destinations and absence of invented testimonials/statistics |
| `/about` | `src/app/about/page.tsx`, E-Cure CSS/copy | Navy hierarchy, white/off-white editorial sections and supplied Islamabad imagery where appropriate | Existing company/contact placeholders and section semantics |
| `/services` and `/services/[slug]` | Existing page files, `shared/service-card.tsx`, `shared/service-icon.tsx`, E-Cure CSS | Restrained cards, care icons and light/blue service hero treatment; physiotherapy attachment where suitable | All six initial slugs, dynamic additions/removals, related-service rules, unknown-slug 404 and booking prefill |
| `/book-appointment` | Existing page, `components/forms/booking-form.tsx`, E-Cure CSS | Clear step hierarchy, comfortable controls, green actions and mobile review layout | Query prefill, all input values, validation, edit/back behavior, consent, anti-bot, review/receipt and request-not-confirmed wording |
| `/contact` | Existing page, `forms/contact-form.tsx`, `shared/contact-details.tsx`, E-Cure CSS | Light form surface and blue/green accents | Verified-only contact fields, topic/validation, reset/error/status behavior and request handling |
| `/faq`, `/privacy-policy`, errors and metadata | Existing pages, accordion/breadcrumb/heading components, E-Cure CSS | Consistent light shell, navy text, readable accordion states and existing legal content | Keyboard behavior, anchors, one H1, unique metadata, preview noindex/sitemap and correct 404s |
| Staff login/MFA | Existing auth pages, `components/admin/auth-forms.tsx`, `src/styles/ecure-admin.css` | Official logo on a white brand area, navy headings, readable controls and green actions | Authentication handlers, MFA policy, error states, credentials clearing, redirects and disabled/unavailable states |
| Staff workspace/records/CMS | `staff-frame.tsx`, `record-table.tsx`, `operations-ui.tsx`, `cms-editor.tsx`, E-Cure admin CSS | Limited palette/logo refinement; navy/white navigation, efficient tables, restrained active states and unchanged semantic status system | All permissions, server-supplied navigation/role labels, semantic table captions/headers, assignment/filter/export/history, revision conflicts and publish/discard behavior |

No additional public routes, UI library replacement, new package or database/schema change is proposed.

## Responsive and interaction plan

All eight requested widths are required: 320, 375, 390, 430, 768, 1024, 1280 and 1440 CSS pixels.

- At 320–430px: intentionally stack hero copy, visible booking/service actions and imagery; keep the official logo readable alongside 44px navigation/phone controls where a real phone is configured. Service cards and forms should use a readable single-column layout. Avoid clipping the full brand artwork or covering content with sticky controls.
- At 768px: use a deliberate tablet composition with readable line lengths, comfortable media framing and a touch-friendly menu. Do not enable desktop navigation until links/logo/booking CTA fit.
- At 1024px: verify the actual desktop-navigation transition, disclosure panel placement and absence of header collisions. Check it again when CMS content is longer than source defaults.
- At 1280/1440px: use a contained editorial layout with white space, navy hierarchy and photo crops that retain the care interaction/landmark. Avoid excessive card repetition and oversized pill buttons.
- Across widths: verify logo ratio/loading, visible booking access, image candidates/crops, target sizes, form labels/errors, focus ring visibility, Escape/Tab behavior, reduced motion and horizontal overflow.
- Staff tables must keep real captions/headers and readable mobile labels. Exercise long names/references, filters, status badges, empty states, dialogs, detail/history and CMS editor controls through the existing authenticated harness after Stage 4 changes.

## Controlled stages and approval gates

| Stage | Concrete work | Required verification before requesting next-stage approval |
| --- | --- | --- |
| 1 — this audit | Map architecture/assets, preserve baseline, evaluate palette, execute current checks and record gaps | Baseline lint/typecheck/unit/build/Playwright; protected-file parity |
| 2 — brand foundations | Install official source assets; client-scoped tokens; reuse typography; update Brand/favicon and shared visual states | Contrast and asset assertions; actual logo proportions/loading at eight widths; navigation/focus; alternate-profile isolation; lint/typecheck/unit/build/targeted browser checks |
| 3 — public pages | Light public redesign across all existing pages, exact headline and approved photography/layout | Full public browser suite, all requested widths, form/prefill/review/error/receipt behavior, metadata and preview indexing; no protected-code changes |
| 4 — staff visual refinement | Limited official-logo/palette/readability changes to the existing staff UI | Real authenticated Owner/Receptionist/MFA/CMS/operations regression harness plus all-width table/control review; no permission/request changes |
| 5 — final quality | Complete responsive/accessibility/SEO/regression review and handoff | Available lint/typecheck/unit/build, public and relevant real-backend browser checks, alternate-profile checks and cross-engine checks; retain known platform limitations honestly |

Pause after each stage and report changed files, executed responsive checks, failures/regressions, test results and protected-file parity. Approval for one stage does not automatically approve the next stage or a new production deployment.

## Stage 1 verification record

These checks validate the existing black/green implementation before redesign. They do not claim that the new blue/green UI has been implemented or tested.

| Check | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm test -- --maxWorkers=1` | PASS — 34 tests in 6 files |
| `npm run build` | PASS — production compilation, TypeScript and route generation |
| `npm run typecheck` | PASS |
| `npm run test:boundaries` | PASS — 21 client roots, 44 source modules, 26 browser bundles |
| `npx playwright test --config .local/ecure-bluegreen-stage1/playwright.config.ts` | PASS — 19 Chromium tests, zero skips, failures or flaky results; 3.2 minutes |
| Final source/protected-file parity | PASS — all 211 captured files unchanged, zero added files in captured application directories; all 64 protected files unchanged |

The audit Playwright config lives only in `.local/ecure-bluegreen-stage1/`, imports the existing default suite, starts a production server on 3100 with CMS/Auth/submissions disabled, and writes screenshots/traces/reports to the same ignored audit directory. The existing suite includes 13 public routes at all eight widths, logo/CTA checks, mobile/desktop keyboard navigation, reduced motion, image loading, metadata, skip links, booking context and contact validation. Scoped accessibility checks run at mobile/desktop widths. The disabled staff-login test covers seven widths, omitting 1280px; add the missing coverage during the relevant implementation stage rather than silently claiming eight-width admin coverage now.

Authenticated staff tables, real provider/MFA sessions, live booking delivery, a redesigned CMS-published document, alternate-profile browser builds and Firefox/WebKit were not exercised by this Stage 1 baseline. They remain explicit later-stage checks. No physical-device or accessibility-certification claim is made.

The local configured app was stopped only for the generated build/test sequence and was restored afterward at `http://127.0.0.1:3000`. Environment files and production settings are unchanged. The live Oracle site is untouched. No failure/regression was found in the executed baseline checks; this does not claim coverage of the explicitly unexecuted authenticated/cross-engine scenarios above. Vitest emitted its existing nonblocking `vite-tsconfig-paths` deprecation/advisory output; no dependency change was made in response.

Machine-readable final parity and browser counts are retained in `.local/ecure-bluegreen-stage1/verification-summary.json`. Exact provided-asset metadata and hashes remain in `baseline.json`; browser results are in `browser-results.json`, with screenshots/traces under `browser-results/` and the HTML report under `browser-report/`.

## Stage 1 file changes

- New report: `docs/design/ECURE_BLUE_GREEN_STAGE_1_AUDIT.md`.
- Ignored audit material only: `.local/ecure-bluegreen-stage1/` (file hashes, exact attachment copies, analysis/configuration and generated browser artifacts).
- Ordinary generated Next.js build/type files may be refreshed by the executed build.
- No application component, CSS, active asset, test source, backend file, dependency or environment setting is intentionally changed.

## Approval requested

Approve Stage 2 only: integrate the supplied official logo and client icon, establish the scoped navy/blue/green/white tokens with readable action colors, reuse Manrope/Inter, and refine shared branding/components while preserving current routes and all backend contracts. Homepage/page composition and staff redesign remain in their separately approved stages.
