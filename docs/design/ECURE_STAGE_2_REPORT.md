# E-Cure redesign: Stage 2

Date: 4 November 2026 (Asia/Karachi).

Status: complete and verified; approved by the user's Stage 3 request on 4 November 2026. The report below records the Stage 2 checkpoint.

## Summary

Implemented the approved shared branding stage: official E-Cure artwork, a black/green/white presentation, Manrope headings and Inter body text, dark header/footer, responsive booking access, accessible navigation, and refined shared buttons, fields and service cards.

The homepage's content, composition and photography remain the existing implementation. Their full redesign belongs to Stage 3. Staff workspace layout changes belong to Stage 4.

## Files and architecture

| File/area | Change |
| --- | --- |
| `src/config/branding.ts` | E-Cure presentation preset, official asset paths, brand and shared layout copy. |
| `src/config/profiles.ts` | Applies the preset to the existing `default` deployment; retains the generic base and three fictional business profiles. |
| `src/types/profile.ts` | Optional frontend-only `presentation` discriminator. No persisted schema change. |
| `src/app/layout.tsx` | Optimized Manrope/Inter font variables and the presentation attribute; metadata, CMS resolution and dynamic rendering preserved. |
| `src/components/website-provider.tsx` | Keeps the presentation attribute synchronized alongside existing theme and custom color updates. |
| `src/styles/ecure.css`, global CSS import | Scoped design tokens, shared controls/cards, header/footer and mobile styles. Existing palettes remain available to the other profiles. |
| `src/components/shared/brand.tsx` | Displays the supplied horizontal lockup at its natural proportions, avoids duplicate lettering, and retains configured/custom logo and generic fallback behavior. |
| `src/components/layout/header.tsx` | Responsive navigation, configured contact shortcuts, collapsible mobile services, mobile booking access and modal-close behavior. |
| `src/components/layout/services-menu.tsx` | Desktop service disclosure, native link tab order, Arrow Up/Down entry, Escape/focus return, hover, blur/outside-click dismissal and resize cleanup. |
| `src/components/layout/footer.tsx` | Shared brand, layout styling and location icon with existing configured contact/service/navigation data. |
| `public/images/branding/` | Original supplied JPEG, horizontal logo and square mark derivatives, and provenance notes. |
| `tests/unit/branding.test.ts` | Deployment identity, intake/configuration preservation and other-profile isolation checks. |
| `tests/e2e/branding.spec.ts`, `foundation.spec.ts`, `public-website.spec.ts` | Responsive artwork/fonts/booking, desktop disclosure, mobile services, focus, scrolling and navigation checks. Existing mobile service test follows the new disclosure; public route checks now include 1280px. |

The deployment ID remains `default`. There is no new database profile or persisted theme value. The original `defaultProfile` remains the reusable generic base; the selected registry entry applies `withEcureBranding()` to it. The other three profiles keep their existing palettes, typography, marks, copy and visibility settings.

## Design and interactions

- Charcoal/black navigation and footer use the supplied logo's original black background.
- The actual house/cross/leaf artwork and original lettering were cropped separately and arranged into a horizontal lockup. No replacement mark was drawn, generated, recolored or subjected to background removal. The original 688 × 1532px JPEG is preserved unchanged.
- The horizontal derivative is 540 × 148px and displays proportionately. The square crop is retained for future brand uses.
- Bright `#22C55E` is reserved for accents on dark surfaces. Primary controls use `#147A3D`, approximately 5.41:1 against white.
- Manrope/Inter apply to the client presentation; alternate business profiles retain Lora/Source Sans 3. Fonts are served through `next/font`.
- Buttons use restrained 6px corners and at least 44px height; fields retain labels, error semantics and 48px input targets. No form handlers or submission hooks changed.
- Shared service cards have consistent borders, 8px corners, spacing and green icon/link treatment. Their content, order, visibility and destinations remain data driven.
- Desktop navigation appears from 1024px. Smaller screens use the existing Radix modal foundation with focus trapping, Escape, scroll locking and close-after-navigation behavior.
- Mobile services expand from an explicitly labelled control. A booking link remains accessible in the small-screen header without adding a fixed overlay over page content.
- Missing phone/email data creates no fabricated contact actions. Existing request/preview notices remain visible, and testimonials remain hidden.

An expanded-state accessibility check found a focusable `aria-hidden` proxy in the previous desktop navigation library output. The desktop disclosure was replaced with a small native control, retaining all service links and styling. The mobile modal still uses Radix. No accessibility rule was disabled to make the test pass.

## Backend preservation

Protected backend files were not modified.

Reviewed the working-tree changes against the original checkpoint. No changes were made to `src/server/**`, `src/app/api/**`, `src/proxy.ts`, database schemas/migrations, Supabase configuration, environment files, setup scripts, dependencies or lockfile. Booking/contact form logic, request payloads, validation, Turnstile, idempotency, receipts, authentication, MFA, role checks, management operations and audit logging remain unchanged.

No CMS draft/publication or real database records were changed. No deployment was performed.

## Verification

| Check | Result |
| --- | --- |
| Lint | PASS after final navigation implementation. |
| TypeScript | PASS after final navigation implementation. |
| Unit tests | PASS: 36 tests across 6 files using `npm.cmd test -- --maxWorkers=1`. The first default-worker run failed with worker-startup timeouts; the single-worker rerun completed successfully. |
| Production build | PASS, including the final default build restored after the profile matrix. |
| Default Chromium browser suite | PASS: all 16 tests in 1.9 minutes after fixing the desktop disclosure. Includes preview booking/contact completion, routes/assets, all eight public-page widths, scoped WCAG checks, three theme examples, keyboard/hover navigation and mobile modal behavior. Initial run exposed the now-fixed hidden focus proxy. |
| Three-profile build/browser matrix | PASS: clinic, home-care and physiotherapy profiles built independently; all 9 browser tests passed. The script restored the default build and verified unchanged source hashes. |
| Backend boundary scan | PASS on final production output: 23 client roots, 49 source modules, 26 browser bundles. No secrets printed. |
| Diff/whitespace and protected-file review | PASS; protected files unchanged. |
| Real persisted submissions, Supabase MFA/login, authenticated staff management | NOT TESTED in Stage 2. Preview forms and unavailable-auth behavior are tested separately; no real patient or staff records are used. |
| Lighthouse / hosted deployment | NOT TESTED. |

Build and browser checks run in `.local/ecure-stage2/build`, an isolated copy of the working source with shared installed dependencies and no copied local secrets. The nested copy produces an informational multiple-lockfile/root-inference warning. It does not require changing project configuration.

## Responsive and visual QA

Target widths: **320, 375, 390, 430, 768, 1024, 1280 and 1440px**.

The E-Cure homepage was captured and checked for overflow, logo proportions, font loading and visible booking access at all eight widths. All checks passed. Full-page desktop (1440px), mobile (390px), expanded mobile-menu screenshots, and an eight-width header/footer comparison were inspected visually. No horizontal overflow, clipped shared branding or overlapping shared controls was found.

The public regression test covers 13 public routes at all eight widths (104 route/viewport combinations), with no observed runtime errors, plus desktop/mobile screenshots and scoped WCAG checks. This is not a claim of a full manual WCAG audit or visual inspection of every page at every size.

## Review preview and limitations

A separate local E-Cure preview is available at **http://127.0.0.1:3300**. It uses disabled submission/auth/CMS modes for review; it cannot save appointment requests or inquiries. The server listens on loopback only.

Existing database-mode CMS publications override the profile's saved name, logo, shared copy and contact details. That behavior is preserved. Installing the new source does not silently replace or publish those values. The E-Cure preset is visible in the separate preview; an already-published deployment needs its approved brand/content applied through the existing Owner editor workflow. Changing its deployment ID or rewriting stored CMS documents is not part of Stage 2.

Final working source matched the isolated build byte-for-byte. The profile matrix source hash before and after was `6fc27e09c4e316302b6da152ac918b92c790cacebf905b62a7901bc9ef9e5ab6`. The retained original logo also matched the supplied JPEG by SHA-256.

Verified business phone, WhatsApp, email, address, hours, detailed coverage, clinical claims and real reviews remain outstanding. The UI does not invent these details. Homepage hero/content, service ordering/composition, local photography, page-specific refinements and the existing generic favicon are Stage 3 follow-up work. The operational admin redesign remains Stage 4.

## Next stage and approval

Stage 3 proposes the homepage composition and all public page refinements: service directory/detail template, About, FAQ, booking/contact presentation, appropriate local copy and image placement, and favicon branding. Preserve the current data-driven service catalog, CMS snapshots, SEO behavior and form submission contracts.

The supplied master prompt says, "Complete only one approved stage at a time." Stage 2 stops for review; Stage 3 requires the user's next approval.
