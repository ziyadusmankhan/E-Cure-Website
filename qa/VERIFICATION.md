# Verification record

## Styling refinement

- Replaced the heading font with Lora, increased heading and navigation weights, and changed primary button corners to 10px.
- Added a fixed WhatsApp control. With no configured URL, its information panel explains that contact details are pending; a configured URL enables the direct chat link.
- Checked homepage overflow at 320, 390, 768, and 1440px: none found.
- Visually reviewed desktop typography and the 320px WhatsApp panel; verified open, close, and Escape behavior.
- Targeted ESLint checks on the changed TypeScript components passed. The production build, including TypeScript checking, passed.
- Updated desktop screenshot: `qa/screenshots/homepage-refined.jpg`.

Completed 21 October 2026 on Windows, Node.js 24.18.0, Next.js 16.4.2.

## Build and source checks

- `npm run lint`: passed with no errors or warnings after correcting the PostCSS default export.
- `npm run typecheck`: passed.
- `npm run build`: passed; all pages generated successfully, including all six statically generated service routes.
- The installed dependency versions are pinned in `package.json` and recorded in `package-lock.json`.
- The current Next.js-generated `AGENTS.md` is retained.

## Production HTTP smoke check

Executed `npm run test:routes` against `http://localhost:3001` using `npm start -- --port 3001`.

- All 12 requested page routes returned HTTP 200.
- Each route had a unique title, a meta description, one H1, and demo noindex metadata.
- All 21 collected internal destinations resolved to supported routes and existing anchors.
- All six rendered image URLs returned HTTP 200 and image content types.
- `/missing-page` and `/services/missing-service` returned HTTP 404.

The script excludes non-navigation preload links from its internal-link checks.

## Browser interactions

Executed in the Codex in-app Chromium browser:

- Opened the desktop Services dropdown using Enter and navigated to Physiotherapy.
- Expanded the physiotherapy FAQ and verified the service-specific answer.
- Followed “Request this service” and verified Physiotherapy was preselected.
- Submitted an empty details step and verified field errors and focus on the first invalid field.
- Entered fictional details, reviewed the summary, edited the name, and verified the revised summary.
- Completed the booking demo and verified: “This is a demonstration. Your request has not been submitted or saved.”
- Started a new request and verified the name field was empty.
- Opened mobile navigation, verified focus moved to Close navigation, and confirmed body scroll locking.
- Followed Contact from the drawer and verified the drawer closed and scroll locking was removed.
- Tested required-field errors and valid completion in the inquiry form using fictional details.
- Followed About from an internal page; the homepage `#about` section landed approximately 105px below the viewport top, clear of the sticky header.
- No console warnings or errors were returned by the browser during these checks.

## Responsive review

- Homepage document widths checked at 320, 390, 768, 1024, 1440, and 1920px: no horizontal overflow.
- Services directory, equipment, physiotherapy, About, Contact, booking, and privacy pages checked at 320px: no horizontal overflow.
- Visually inspected desktop hero and full homepage, tablet homepage, mobile hero, mobile appointment fields, mobile drawer, and desktop equipment page.
- Verified local photography loaded in the homepage browser view; all image URLs were also covered by the production smoke check.

Local screenshots are in `qa/screenshots/` (ignored by Git):

- `homepage-desktop.jpg`
- `homepage-full.jpg`
- `homepage-mobile.jpg`
- `equipment-desktop.jpg`

## Scope

This is a frontend demonstration. No live booking, contact delivery, backend, or deployment was tested or configured. No Lighthouse score, automated accessibility audit, or cross-browser certification is claimed. Keyboard navigation, labels/errors, focus behavior, responsive overflow, and representative visual layouts were checked as described above. Reduced-motion styles are included in source.
