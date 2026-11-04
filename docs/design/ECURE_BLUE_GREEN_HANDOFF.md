# E-Cure blue/green redesign handoff

## Review locations

| Location | Purpose |
| --- | --- |
| `https://144.24.117.229/` | Oracle HTTPS website preview |
| `http://127.0.0.1:3000/` | Configured local application and its saved CMS publication |
| `http://127.0.0.1:3000/admin/login` | Configured local staff sign-in with Supabase Auth/MFA |
| `http://127.0.0.1:3602/` | Source-design preview when its preview server is running; auth/submissions disabled |

The configured app and source preview may show different editable copy because saved CMS content is authoritative. The generic saved brand was corrected to E-Cure on 5 November 2026 without discarding the other pending draft edits. A disabled-auth preview cannot accept staff credentials. Existing local Owner account details remain in the ignored local account file referenced by the root README; they are not cloud credentials.

The later client request adds **HOME HEALTH SERVICES** beneath the official logo and refines public interactions. The configured CMS subtitle was corrected from `SERVICES`; the prior draft differed only in that subtitle, so this requested correction resolves it. Draft/publication are now both revision 9, with every other content field preserved. See [the refinement record](ECURE_LOGO_AND_MOTION_REFINEMENT.md).

## Brand and editing

The official client JPEG is used intact. Source identity/assets and the configurable client theme are in `src/config/branding.ts` and `src/config/client-presentation.ts`. Headings use Manrope, body text uses Inter; white/off-white surfaces, navy headings, blue navigation and green primary actions match the approved direction. Existing custom CMS logos/colors retain their precedence.

The subtitle uses the existing editable `brandLine`. E-Cure's finite hero, dropdown, mobile navigation and hover transitions are scoped in `src/styles/ecure-motion.css` and respect reduced-motion preferences. Desktop navigation also supports keyboard and click; mobile services expand by touch/keyboard.

The subsequent [client photography update](ECURE_CLIENT_PHOTOGRAPHY_UPDATE.md) uses the confirmed image #6 on the homepage and for caretaker care, image #7 for nursing, and matching supplied physiotherapy, equipment, online-consultation and laboratory photos. Client-specific media presets and exact legacy-reference mapping preserve custom uploads and other clients' imagery. No saved CMS content was changed for that update.

Use the Owner website editor for client content, contacts, images, services and their order/visibility. Six source service categories remain enabled; the catalog supports adding/disabling services. Drafts stay private until published. Use the configured staff workspace for requests, customers, inquiries, assignments, history and exports under the existing roles.

No client phone/email, staff qualifications, statistics or testimonials have been invented. Public placeholders and preview notices remain where client data or production delivery is unconfigured. An appointment request remains distinct from a confirmed care appointment.

## Verification

See [the current Stage 5 report](ECURE_BLUE_GREEN_STAGE_5_REPORT.md) for the exact executed checks, corrections and limits. Reports for Stages 1–4 preserve their individual changes and test evidence. Older `ECURE_STAGE_*` reports refer to the previous black/green milestone.

The requested layout widths are 320, 375, 390, 430, 768, 1024, 1280 and 1440 CSS pixels. Automated Chromium/Firefox/WebKit coverage is distinct from physical-device or actual iOS/macOS Safari testing.

## Current production boundary

Oracle serves the redesigned website through trusted HTTPS, while CMS, real staff authentication and real submissions remain disabled on that VM. A hosted production Auth service/database and live submission configuration have not been provided. Local test databases, generated account details and provider credentials are not transferred to Oracle.

For operational launch, the existing platform still needs production database/Auth configuration, real Turnstile/origin settings and the reviewed production profile/content. The current preview intentionally remains noindex with an empty sitemap. Confirm the client contact details, final privacy content and canonical public URL before enabling live operation/indexing. This handoff does not claim live booking delivery or an operational cloud staff login.

See [Oracle deployment status](../deployment/ORACLE_INSTANCE_STATUS.md) for the current release and retained rollback artifact. The current frontend redesign keeps the existing routes, authentication/authorization, schemas and business logic.
