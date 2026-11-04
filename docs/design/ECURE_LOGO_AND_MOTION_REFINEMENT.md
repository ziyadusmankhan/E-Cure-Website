# E-Cure logo subtitle and interaction refinement

Completed 5 November 2026, Asia/Karachi. The verified refinement is deployed at [the Oracle HTTPS preview](https://144.24.117.229/).

## Client request and implementation

The supplied official JPEG remains intact. The shared official-logo layout now renders the configurable `brandLine` beneath the artwork: **HOME HEALTH SERVICES**. This appears in the public header/footer, mobile navigation and shared staff branding. Header spacing accommodates the extra line on small screens as well as desktop. Custom/non-E-Cure logos retain their existing rendering.

The E-Cure presentation adds finite, subtle hero entrances, animated navigation underlines and disclosure chevrons, a short dropdown entrance, mobile drawer open/close transitions, mobile-services disclosure feedback, and restrained card/button hover movement. Fine-pointer hover movement is limited to devices that support hover. Reduced-motion preference disables the new entrance/movement effects; content and controls remain available. No perpetual animation, scroll-jacking, scroll-triggered hidden content or new animation dependency is introduced.

The existing Services disclosure keeps native links, keyboard navigation, Escape/focus restoration, outside-click dismissal and mobile touch controls. A transparent pointer area covers the gap above the dropdown, with a short pointer-leave interval. The first mouse click pins a hover-open menu instead of immediately closing it; keyboard activation and subsequent clicks retain toggle behavior. Pending hover timers are cancelled on resize, keyboard dismissal and navigation to prevent accidental reopening.

## Saved CMS subtitle

The configured local publication had saved `brandLine` as `SERVICES`, overriding the source preset. A backed-up, validated content transaction changed only `brand.brandLine` in the saved draft/publication to the requested source value. Read-only comparisons confirm every other content field is unchanged.

The earlier draft differed from publication only in that subtitle. This explicit client request resolves that pending subtitle edit; draft and publication are now both revision 9. No unrelated draft was published or discarded. A structural publication audit entry was recorded. The CMS backup remains ignored/local and is excluded from the cloud source package. Backend source, schemas, APIs, credentials and authorization were not altered.

## Files

- `src/components/shared/brand.tsx`: configurable subtitle below official artwork.
- `src/styles/ecure.css`: shared subtitle layout and responsive header spacing.
- `src/styles/ecure-motion.css` (new), `src/app/globals.css`: scoped interaction styling/import.
- `src/components/layout/services-menu.tsx`: resilient pointer timing and timer cancellation.
- `tests/e2e/brand-motion.spec.ts` (new): subtitle geometry at all eight widths, pointer/keyboard dismissal and reduced-motion behavior.
- This record and current handoff/deployment documentation.

## Verification

- Passed lint, standalone TypeScript, local production build and browser/server boundary checks.
- Passed 39 unit tests in 7 files.
- The initial full public suite exercised 81 cases across Chromium, Firefox and WebKit: 79 passed, while two new WebKit cases exposed pointer-gap and hover/click timing issues. These were corrected before publication. Public route/booking/image/metadata checks and scoped accessibility scans passed in that run.
- **Passed all 27 focused final cases** against the rebuilt Linux/amd64 Oracle candidate: nine each in Chromium, Firefox and WebKit, with no failures, retries/flaky cases or skips. This repeats the affected logo/navigation/hover/reduced-motion behavior, including the two previously failing scenarios. Tests cover 320, 375, 390, 430, 768, 1024, 1280 and 1440px layouts. The original full run is retained separately and is not described as an 81/81 pass.
- The clean Linux/amd64 Oracle candidate built successfully; all 13 public routes returned 200.
- After cutover, the public HTTPS smoke passed all 13 routes and all eight homepage widths, subtitle visibility/fit, official logo/favicon byte comparisons, mobile navigation and service booking prefill. The sharper 768px image remains correct, HTTP redirects with 308, normal TLS validation passes and no JavaScript page errors were observed. Fresh live captures confirm the subtitle on desktop/mobile and the active dropdown animation.
- Supplementary local captures confirm the subtitle and dropdown/mobile presentation. Physical devices and actual iOS/macOS Safari are not tested.

The protected-file comparison confirms all **64 backend/configuration files unchanged**, with no unexpected application/asset/test changes. No database regression or real-auth harness rerun was needed for this frontend/content-only refinement; their previous Stage 5 results remain historical, not new runs. Windows WebKit typography can render lighter than Chromium/Firefox, as recorded in Stage 5; physical devices and actual Safari remain outside this verification.

## Deployment

The active image is `ecure:20261105-46e19ef3f411`, release `/opt/ecure/releases/20261105-46e19ef3f411`; `/opt/ecure/current` points there. The clean source archive contains 219 allowlisted entries, 7,039,081 bytes, SHA-256 `46e19ef3f411a9805e7fb78125f84abfe27a2e315011c24e06ed5947ef3e931d`. Credentials, local databases, backups and test results were excluded.

The preceding Stage 5 container is retained as `ecure-previous-20261105-c3dcbde7beec`. The new container is healthy, Caddy remains active, and about 40 GB remains free. The app still binds only to loopback; runtime configuration, TLS and firewall settings were retained. The temporary candidate and SSH tunnel were removed/stopped after the checks. Existing cloud CMS/Auth/submission modes remain disabled pending the separate production configuration.

Verification artifacts are ignored under `.local/ecure-brand-motion/`, including initial/final browser results, source/protected hashes, CMS comparison and desktop/mobile captures. See [deployment status](../deployment/ORACLE_INSTANCE_STATUS.md) for the current public smoke result and rollback reference.
