# E-Cure Home Health Services

A multi-page Next.js App Router healthcare website with typed business profiles, E-Cure branding, a PostgreSQL/Drizzle backend, appointment/contact submissions, local Supabase staff authentication with MFA, role-scoped administration and a website editor. Outbound email delivery is not enabled.

The default E-Cure site directs bookings and equipment orders to the company's phone, email and WhatsApp links. The other demo profiles still support the form workflows where enabled.

## E-Cure redesign review

The five redesign stages are separate from the platform development phases below. The blue/green redesign is recorded in [the design reports](docs/design/), the [completed Stage 5 report](docs/design/ECURE_BLUE_GREEN_STAGE_5_REPORT.md), the subsequent [client logo/interaction refinement](docs/design/ECURE_LOGO_AND_MOTION_REFINEMENT.md) and [current handoff](docs/design/ECURE_BLUE_GREEN_HANDOFF.md). Earlier `ECURE_STAGE_*` reports describe the previous black/green milestone. The approved redesign is deployed at [the Oracle HTTPS preview](https://144.24.117.229/); see [deployment status](docs/deployment/ORACLE_INSTANCE_STATUS.md) for the current release and production-service limitations.

The configured local staff app uses `http://127.0.0.1:3000/admin/login`. A visual preview started with authentication disabled cannot accept staff credentials. Use the configured app for sign-in; preview screenshots use fictional test records.

## Oracle Cloud deployment

Use the production Docker build described in [ORACLE_CLOUD.md](docs/deployment/ORACLE_CLOUD.md). The allowlisted build context excludes local databases, credentials, development dependencies, tests, reports and old preview copies. The runtime image contains the standalone Next.js server, traced dependencies, public assets and compiled static assets. Build on Linux/Docker for the Oracle VM architecture; do not upload Windows `node_modules` or a Windows build.

## Run locally

Phases 1–6 are approved; Phase 7 implementation and verification are documented in `docs/DEVELOPMENT_STATUS.md` and `docs/phases/`. Phase 8 requires separate approval.

Use a current Node.js LTS release (Node 24 was used during development).

```bash
npm install
npm run dev
```

Open http://localhost:3000. If the port is occupied, Next.js prints the selected port.

This workspace has local-test submissions configured in ignored `.env.local`. Start its database before the app with `npm.cmd run db:local:start`, then open http://127.0.0.1:3000. Use fictional details: entries really persist, and receipts do not confirm care or send email. See [local submission setup and troubleshooting](docs/architecture/SUBMISSIONS.md). Stop the database with `npm.cmd run db:local:stop` before restarting Windows.

Staff access is at `/admin/login`. This workspace has local Supabase configured and a user-authorized Owner account; its generated login details remain in ignored `.local/supabase/owner-access.txt`. Enroll your authenticator on first sign-in. For a fresh setup, start Docker Desktop, run `npm.cmd run supabase:start` then `npm.cmd run auth:local:configure`, and restart the app. Create/link additional identities through the controlled steps in [AUTHENTICATION.md](docs/architecture/AUTHENTICATION.md). No default password, seeded staff identity or public signup exists. `npm.cmd run test:auth` passes all nine real local Supabase browser tests using disposable accounts. Unconfigured environments deliberately show an unavailable sign-in state.

The public frontend runs without database access. For the approved local PostgreSQL foundation, installed PostgreSQL binaries are required:

```powershell
npm.cmd run db:local:start
npm.cmd run db:check
npm.cmd run test:db
```

Development uses a persistent workspace cluster on port 55433; tests use a separate cluster on 55432 and fresh disposable databases. Local setup preserves existing environment files and never prints credentials. `db:local:stop` retains development data; `db:local:migrate` applies reviewed migrations. Supabase configuration is prepared but its running stack/hosted verification is deferred by the user's local-PostgreSQL choice. See `docs/architecture/BACKEND.md` for the complete setup, schema, permissions and service contract.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

With the production server running, use a second terminal for the route and asset smoke check:

```bash
npm run test:routes
```

The check defaults to `http://localhost:3000`. Set `QA_BASE_URL` when testing another port. See `qa/VERIFICATION.md` for the executed checks and their scope.

The lockfile records the resolved dependency versions. Use `npm ci` for reproducible installations. Next.js font optimization uses Manrope and Inter for E-Cure, retaining Lora and Source Sans 3 for other profiles, and serves the fonts locally. The first build needs access to Google Fonts.

## Routes

The component-review sandbox and mock admin page were removed during hosting cleanup. The operational staff workspace remains at `/admin`. Shared runtime buttons, navigation, forms, FAQs and theme/profile support remain in place.

For automated browser verification, run `node node_modules/playwright/cli.js install chromium`, `npm run build`, then `npm run test:e2e`. Playwright starts its own production server on port 3100 with external service modes disabled. Run dev and build sequentially to avoid generated-type file races. See `docs/testing/README.md` for details.

- `/` — hero, services, about, home care benefits, process, CTA and contact options; testimonials remain hidden for E-Cure until approved content is configured
- `/about` — home care philosophy and editable company placeholders
- `/services` — all six care categories
- `/faq` — grouped general questions, accessible answers, and service-specific cross-links
- `/services/online-consultation`
- `/services/physiotherapy`
- `/services/caretaker-services`
- `/services/medical-equipment`
- `/services/laboratory-services`
- `/services/nursing-care`
- `/book-appointment` — redirects to `/contact` for E-Cure. Enabled demo profiles retain the request form.
- `/contact` — direct contact options for E-Cure and an inquiry form on demo profiles where enabled
- `/privacy-policy` — mode-specific processing notice

All six service routes are generated from typed content and can be loaded directly. Unknown routes show a custom 404. Homepage anchors include `#about`, `#services`, `#why-home-care`, `#how-it-works`, and `#contact`.

## Change the company name, logo, and business details

Edit the selected public profile in `src/config/profiles.ts`; `src/config/site.ts` now selects and validates it. See `docs/architecture/WHITE_LABEL.md` for the full configuration contract.

- `name`: full company name for page titles, accessible labels, and copyright
- `shortName`: short display name in the header and footer
- `brandLine`, `businessType`, `theme`: logo subtitle, business category and controlled palette
- `logo.src`: local image path such as `/images/company-logo.svg`; leave empty to use the temporary house/cross mark
- `logo.alt`: description for the official logo
- `contact`: phone, email, address, serviceArea, whatsappUrl, and mapUrl
- `socialLinks`: `{ label, url }` entries
- `showTestimonials`: hide the placeholder section by setting this to `false`
- `demo`: keeps search engines out while this is a demonstration

Choose a profile before starting dev or building production:

```powershell
$env:NEXT_PUBLIC_SITE_PROFILE = "general-clinic"
npm.cmd run dev
```

Options: `default` (the existing site), `general-clinic`, `home-care`, `physiotherapy-center`. The three named businesses are clearly fictional demos. Restart dev or rebuild production after switching. Keep the same profile environment for build and start. Leave `SITE_THEME` unset to use the selected profile's palette.

`npm.cmd run test:profiles` independently builds and browser-tests all three fixtures, records an unchanged-source hash, and restores a default production build afterward. Stop dev and other builds first. Detailed results/screenshots are generated in `.profile-results/`. This matrix is also configured in CI; no hosted run is implied by local results.

Empty contact values appear as plain, explanatory text. Phone, email, WhatsApp, map, and social actions become links only when configured. Use full validated HTTPS URLs for external destinations. These changes do not activate the forms.

The fixed WhatsApp icon appears throughout the site. With an empty `contact.whatsappUrl`, it opens a clear “coming soon” information panel. Once a real WhatsApp URL is configured, it opens that chat directly in a new tab.

## Content and appearance

- `src/data/service-catalog.ts` and `src/config/service-templates.ts`: service descriptions, media, inclusions, preparation and FAQs. Profile entries select enabled services and display order. `src/data/services.ts` exposes only the active catalog to UI and booking validation.
- `src/config/content/default-copy.ts`: centralized, typed public page and form copy. Each profile overrides the fields that differ.
- `src/config/profiles.ts`: homepage benefits/process, FAQ groups, hero/About media, navigation, SEO defaults and section/feature flags. The data modules expose the selected profile.
- `src/app/globals.css`: shared design tokens, component styles, responsive rules, and reduced-motion support; Tailwind CSS v4 is configured for utility extensions.
- `src/components/ui`: selectively adopted shadcn-style Button (Slot/CVA) and Radix Accordion. `components.json` supports adding additional shadcn components.
- `src/components/layout/header.tsx`: Radix keyboard-accessible desktop navigation and modal mobile navigation, with focus trapping, body scroll locking, and navigation-close behavior.

Replace demo text only with approved business information. Do not publish unverified credentials, staff identities, service areas, turnaround times, prices, or testimonials. The testimonials section intentionally contains no invented reviews.

## Images

Assets are local in `public/images`; photo source links and licensing notes are in `public/images/CREDITS.md`. Photography is illustrative and must not be represented as company personnel. Edit media/alt text in the profile or service catalog. The three new SVG logo marks are original fictional demonstration assets.

Next.js Image optimizes photographs and provides responsive sizing. The small custom SVG illustrations remain vectors. Keep replacements appropriately cropped and compressed; preserve declared image containers to prevent layout shifts.

## Public request forms

This section applies to profiles with forms enabled. E-Cure handles requests through direct contact.

React Hook Form keeps entries in component memory. Disabled mode retains the frontend demonstration. Local-test mode sends to protected POST endpoints with independent server validation, consent, Turnstile, durable rate limits and retry-safe duplicate protection. Completion clears personal form data; no browser storage or analytics payloads are used.

The booking URL accepts a known service slug, for example `/book-appointment?service=physiotherapy`; invalid slugs leave the selection empty. The flow validates service, name, phone, optional email, future/today date, time preference, and inquiry length. Contact validates name, email, topic, and message. Example details should be used throughout.

The server layer lives under `src/server/submissions/`. See [SUBMISSIONS.md](docs/architecture/SUBMISSIONS.md) for setup, HTTP contracts, transaction/permission boundaries, privacy, limits and test commands. `SUBMISSIONS_MODE=live` rejects dummy keys and demo profiles. Real business identity, credentials, proxy settings and operational approval remain required; changing `site.demo` alone does not activate submissions.

## Deploy to Vercel

1. Commit this source to your repository and import it into Vercel.
2. Choose the Next.js preset, repository root, `npm run build`, and a supported Node.js LTS version. The direct-contact site runs without a database. Backend-enabled deployments need independent restricted runtime credentials and a separately controlled migration job as documented in `docs/architecture/BACKEND.md`.
3. Set `NEXT_PUBLIC_SITE_URL=https://www.ecurehomes.com` for E-Cure and keep CMS, staff sign-in and public form submissions disabled for the direct-contact site.
4. Deploy and verify direct navigation, images, FAQs, mobile menu, phone, email and WhatsApp links. The old E-Cure appointment URL should redirect to Contact.

### E-Cure search launch

Keep `SITE_INDEXING_ENABLED` unset or `false` while the client reviews the site. After approval, set it to `true` in Vercel **Production** and redeploy. Only the E-Cure profile at `www.ecurehomes.com` becomes indexable. Preview and alternate hosts continue to serve `noindex` and empty sitemaps.

Check the non-`www` redirect and `/robots.txt`. Confirm that `/sitemap.xml` lists exactly the 12 public URLs, that each declares its own canonical URL, and that preview and Vercel alias URLs still return `noindex` and an empty sitemap. If the live checks fail, switch indexing off and redeploy.

After the live checks pass, [verify the `ecurehomes.com` Domain property](https://support.google.com/webmasters/answer/9008080) in Google Search Console with a TXT record in Cloudflare. Submit `https://www.ecurehomes.com/sitemap.xml`, then inspect the homepage, Physiotherapy, and Nursing Care.

## Deliberate simplicity

Server Components are used for pages and content. Client components are limited to navigation, FAQs, and forms. Small CSS transitions respect reduced-motion preferences; no animation library is loaded for these simple effects. No fake loading delays, medical outcomes, ratings, or claims of a confirmed appointment are used.
