# Home Health Services

A multi-page Next.js App Router healthcare website with typed business profiles, a PostgreSQL/Drizzle backend and Phase 6 appointment/contact submissions. The default remains a frontend preview; explicitly enabled local-test mode saves fictional requests. Authentication, administration and email delivery remain later phases.

## Run locally

Phases 1–6 are tracked in `docs/DEVELOPMENT_STATUS.md` and `docs/phases/`. Later phases require separate approval.

Use a current Node.js LTS release (Node 24 was used during development).

```bash
npm install
npm run dev
```

Open http://localhost:3000. If the port is occupied, Next.js prints the selected port.

This workspace has local-test submissions configured in ignored `.env.local`. Start its database before the app with `npm.cmd run db:local:start`, then open http://127.0.0.1:3000. Use fictional details: entries really persist, and receipts do not confirm care or send email. See [local submission setup and troubleshooting](docs/architecture/SUBMISSIONS.md). Stop the database with `npm.cmd run db:local:stop` before restarting Windows.

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

The lockfile records the resolved dependency versions. Use `npm ci` for reproducible installations. Next.js font optimization downloads Lora (bold, classic headings) and Source Sans 3 (clean, modern body text) at build time, then serves them locally. The first build needs access to Google Fonts.

## Routes

The opt-in `/design-system` review page demonstrates three theme presets, shared forms/dialogs, status chips, responsive tables and an admin layout using fictional records. It returns 404 unless `ENABLE_DESIGN_SYSTEM=true`. To review it in PowerShell:

```powershell
$env:ENABLE_DESIGN_SYSTEM = "true"
npm run dev
```

Then open http://localhost:3000/design-system. Use `SITE_THEME=clinical-blue`, `soft-teal`, or `warm-neutral` before a build to choose a deployment preset. Keep the review flag disabled on customer deployments.

For automated browser verification, run `npx playwright install chromium`, `npm run build`, then `npm run test:e2e`. Playwright starts its own production server on port 3100 and enables the review fixture only for that process. Run dev and build sequentially to avoid generated-type file races. See `docs/testing/README.md` for details.

- `/` — hero, services, about, home care benefits, process, clearly labeled testimonial placeholder, CTA, contact preview
- `/about` — home care philosophy and editable company placeholders
- `/services` — all six care categories
- `/faq` — grouped general questions, accessible answers, and service-specific cross-links
- `/services/online-consultation`
- `/services/physiotherapy`
- `/services/caretaker-services`
- `/services/medical-equipment`
- `/services/laboratory-services`
- `/services/nursing-care`
- `/book-appointment` — selection, validated details, editable review, preview completion or persisted request receipt
- `/contact` — configured contacts and validated preview/persisted inquiry
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

React Hook Form keeps entries in component memory. Disabled mode retains the frontend demonstration. Local-test mode sends to protected POST endpoints with independent server validation, consent, Turnstile, durable rate limits and retry-safe duplicate protection. Completion clears personal form data; no browser storage or analytics payloads are used.

The booking URL accepts a known service slug, for example `/book-appointment?service=physiotherapy`; invalid slugs leave the selection empty. The flow validates service, name, phone, optional email, future/today date, time preference, and inquiry length. Contact validates name, email, topic, and message. Example details should be used throughout.

The server layer lives under `src/server/submissions/`. See [SUBMISSIONS.md](docs/architecture/SUBMISSIONS.md) for setup, HTTP contracts, transaction/permission boundaries, privacy, limits and test commands. `SUBMISSIONS_MODE=live` rejects dummy keys and demo profiles. Real business identity, credentials, proxy settings and operational approval remain required; changing `site.demo` alone does not activate submissions.

## Deploy to Vercel

1. Commit this source to your repository and import it into Vercel.
2. Choose the Next.js preset, repository root, `npm run build`, and a supported Node.js LTS version. The public frontend demo still runs without a database. Backend-enabled deployments need independent restricted runtime credentials and a separately controlled migration job as documented in `docs/architecture/BACKEND.md`.
3. Optionally configure `NEXT_PUBLIC_SITE_URL` with the real deployment URL for canonical metadata. Keep `site.demo: true` for a demonstration.
4. Deploy and verify direct navigation, images, FAQs, mobile menu, and both form flows.

The demo uses `noindex` metadata and disallows crawlers. Its sitemap intentionally remains empty until `site.demo` is false and a canonical URL is configured. Before a production launch, replace placeholder business/legal information and implement the operational service flow.

## Deliberate simplicity

Server Components are used for pages and content. Client components are limited to navigation, FAQs, and forms. Small CSS transitions respect reduced-motion preferences; no animation library is loaded for these simple effects. No fake loading delays, medical outcomes, ratings, or claims of a confirmed appointment are used.
