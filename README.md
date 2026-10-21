# Home Health Services — frontend demonstration

A complete multi-page Next.js App Router project for presenting a home healthcare website. Temporary branding and deliberately unconfirmed business information are editable in one place. There is no booking backend, database, authentication, payment system, or form persistence.

## Run locally

Use a current Node.js LTS release (Node 24 was used during development).

```bash
npm install
npm run dev
```

Open http://localhost:3000. If the port is occupied, Next.js prints the selected port.

```bash
npm run lint
npm run typecheck
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

- `/` — hero, services, about, home care benefits, process, clearly labeled testimonial placeholder, CTA, contact preview
- `/about` — home care philosophy and editable company placeholders
- `/services` — all six care categories
- `/services/online-consultation`
- `/services/physiotherapy`
- `/services/caretaker-services`
- `/services/medical-equipment`
- `/services/laboratory-services`
- `/services/nursing-care`
- `/book-appointment` — service selection, validated details, editable review, demo completion
- `/contact` — configured contact information and validated demo inquiry
- `/privacy-policy` — provisional demonstration notice

All six service routes are generated from typed content and can be loaded directly. Unknown routes show a custom 404. Homepage anchors include `#about`, `#services`, `#why-home-care`, `#how-it-works`, and `#contact`.

## Change the company name, logo, and business details

Edit `src/config/site.ts`:

- `name`: full company name for page titles, accessible labels, and copyright
- `shortName`: short display name in the header and footer
- `logo.src`: local image path such as `/images/company-logo.svg`; leave empty to use the temporary house/cross mark
- `logo.alt`: description for the official logo
- `contact`: phone, email, address, serviceArea, whatsappUrl, and mapUrl
- `socialLinks`: `{ label, url }` entries
- `showTestimonials`: hide the placeholder section by setting this to `false`
- `demo`: keeps search engines out while this is a demonstration

Empty contact values appear as plain, explanatory text. Phone, email, WhatsApp, map, and social actions become links only when configured. Use full validated HTTPS URLs for external destinations. These changes do not activate the forms.

The fixed WhatsApp icon appears throughout the site. With an empty `contact.whatsappUrl`, it opens a clear “coming soon” information panel. Once a real WhatsApp URL is configured, it opens that chat directly in a new tab.

## Content and appearance

- `src/data/services.ts`: descriptions, hero copy, imagery, inclusions/equipment categories, audiences, preparation, FAQs, and related-service slugs. The `Service` type is in `src/types/service.ts`.
- `src/data/site-content.ts`: homepage benefits and the four-step process.
- `src/app/globals.css`: shared design tokens, component styles, responsive rules, and reduced-motion support; Tailwind CSS v4 is configured for utility extensions.
- `src/components/ui`: selectively adopted shadcn-style Button (Slot/CVA) and Radix Accordion. `components.json` supports adding additional shadcn components.
- `src/components/layout/header.tsx`: Radix keyboard-accessible desktop navigation and modal mobile navigation, with focus trapping, body scroll locking, and navigation-close behavior.

Replace demo text only with approved business information. Do not publish unverified credentials, staff identities, service areas, turnaround times, prices, or testimonials. The testimonials section intentionally contains no invented reviews.

## Images

Assets are local in `public/images`; photo source links and licensing notes are in `public/images/CREDITS.md`. Photography is illustrative and must not be represented as company personnel. Replace the asset or update its path and descriptive alt text in service data. Main homepage images are referenced in `src/app/page.tsx`; the About image is in `src/app/about/page.tsx`.

Next.js Image optimizes photographs and provides responsive sizing. The small custom SVG illustrations remain vectors. Keep replacements appropriately cropped and compressed; preserve declared image containers to prevent layout shifts.

## Demo forms and future backend integration

`src/lib/validations.ts` holds Zod schemas. React Hook Form manages entries in component memory. There are no form fetch requests, browser storage writes, analytics events, or console logging of form contents. Completion resets the form data. Navigating away unmounts the form.

The booking URL accepts a known service slug, for example `/book-appointment?service=physiotherapy`; invalid slugs leave the selection empty. The flow validates service, name, phone, optional email, future/today date, time preference, and inquiry length. Contact validates name, email, topic, and message. Example details should be used throughout.

To add a real backend later:

1. Establish approved care scope, identity, privacy notices, consent, retention, and operational ownership.
2. Add a dedicated server-side booking API with independent validation, appropriate access protections, rate limiting, and controlled storage. Never trust client validation alone.
3. Replace the completion handler in `src/components/forms/booking-form.tsx` and the contact submit handler in `src/components/forms/contact-form.tsx` with a request to that API. Add real pending/error states, retry handling, and duplicate submission protection.
4. Distinguish an acknowledged request from a confirmed appointment. Only show confirmation that the backend actually provides.
5. Update the demonstration notices and privacy text to reflect the implemented data handling. Changing `site.demo` alone deliberately does not activate submissions.

## Deploy to Vercel

1. Commit this source to your repository and import it into Vercel.
2. Choose the Next.js preset, repository root, `npm run build`, and a supported Node.js LTS version. No database or secret is needed for the demo.
3. Optionally configure `NEXT_PUBLIC_SITE_URL` with the real deployment URL for canonical metadata. Keep `site.demo: true` for a demonstration.
4. Deploy and verify direct navigation, images, FAQs, mobile menu, and both form flows.

The demo uses `noindex` metadata and disallows crawlers. Its sitemap intentionally remains empty until `site.demo` is false and a canonical URL is configured. Before a production launch, replace placeholder business/legal information and implement the operational service flow.

## Deliberate simplicity

Server Components are used for pages and content. Client components are limited to navigation, FAQs, and forms. Small CSS transitions respect reduced-motion preferences; no animation library is loaded for these simple effects. No fake loading delays, medical outcomes, ratings, or claims of a confirmed appointment are used.
