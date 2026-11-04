# E-Cure client photography update

Completed 5 November 2026, Asia/Karachi. The new photography is deployed at [the Oracle HTTPS preview](https://144.24.117.229/).

## Approved placement

The user explicitly confirmed image #6 for the homepage: an older woman holding a walking stick beside a caregiver. The selected six distinct originals are copied intact into the configurable E-Cure asset directory; Next.js generates the responsive delivery variants.

| Placement | Supplied image | Installed asset |
| --- | --- | --- |
| Homepage and Caretaker Services | #6, caregiver beside an older woman | `home-care-companion.png` |
| Nursing Care | #7, home blood-pressure check | `nursing-at-home.png` |
| Physiotherapy | #5, supported leg stretch on a treatment table | `physiotherapy-treatment.jpg` |
| Medical Equipment | #3, blood-pressure monitor and medical supplies | `medical-equipment.jpg` |
| Online Consultation | #8, laptop video consultation | `online-consultation.jpg` |
| Laboratory Services | #9, sample tube and centrifuge | `laboratory-services.jpg` |

The E-Cure source preset supplies the new homepage/service media. Render-time mapping also updates known legacy E-Cure media references in saved CMS publications. Custom uploaded/other image paths and non-E-Cure presentations remain authoritative and untouched. Unknown/new service slugs retain their configured image, preserving the editable catalog. The existing icon-based service overview cards retain their layout; the selected photos occupy the homepage and corresponding detail-page image frames.

Alt text describes the actual scenes. The equipment crop favors the upper part of the portrait original to keep the monitor visible. The homepage crop keeps both people visible. No client staff credentials, clinical results or new service promises are inferred from the photos. Existing preview/illustrative notices remain.

## Files

- `src/config/branding.ts`: client photography presets and exact legacy-image fallbacks.
- `src/app/page.tsx`: resolve the configured homepage photograph.
- `src/app/services/[slug]/page.tsx`: resolve matching service photos and scoped responsive image sizing.
- `src/styles/ecure-public.css`: crop positions for the approved homepage/equipment assets.
- Six originals under `public/images/ecure/` as listed above.
- `tests/unit/client-presentation.test.ts`: mapping, other-client isolation and custom-upload preservation.
- `tests/e2e/public-redesign.spec.ts`: current physiotherapy image expectation.
- `tests/e2e/client-photography.spec.ts` (new): matching images decode at all eight requested widths, meaningful alt text and overflow checks.

## Verification and deployment

Passed lint, standalone TypeScript, client/server boundary checks, local production build and 39 unit tests in 7 files. The initial Oracle Linux/amd64 candidate built successfully and all 13 public routes returned 200. The browser suite exercises the seven placements at 320, 375, 390, 430, 768, 1024, 1280 and 1440px in Chromium, Firefox and WebKit, plus metadata/image/booking regression checks.

The initial 27-case run had 26 passes and one WebKit failure from cancelled Next.js link prefetches during 56 repeated full-document navigations. Its photo mapping/decode/layout assertions passed before the final error-list assertion. The test now navigates once per route, resizes across the eight widths, and settles outstanding prefetches before the next document navigation. All three photo-placement rechecks passed with no page errors. No application/network/security behavior was changed to suppress the test warning. The initial result is retained separately and is not reported as a 27/27 pass.

A final own-property guard ensures arbitrary future service slugs, including inherited object-property names, retain their configured custom image. Unit checks cover this fallback. The selected photos and their normal mapping paths are unchanged by that defensive guard. The local production build and all 39 unit tests were repeated successfully after it; the final Linux/amd64 image also built successfully.

Desktop service crops and supplementary desktop/mobile homepage captures were visually reviewed. Physical-device and actual iOS/macOS Safari testing remain unperformed. No backend routes, authentication, authorization, schemas, migrations, processing logic or saved CMS documents are edited for this photo update.

All six installed assets match their supplied originals byte for byte. All 64 protected backend/configuration files match the captured baseline, and the verification found no unexpected application/asset/test changes. Both the configured local app and source preview show all seven expected placements.

Ignored `.local/ecure-client-photos/` retains original-byte hashes, verification results, browser artifacts and deployment evidence. Source packaging excludes local credentials, databases, backups and test artifacts. Cloud CMS/Auth/submissions remain disabled pending the separate production configuration.

## Release

The active image is `ecure:20261105-fc4386677647`, release `/opt/ecure/releases/20261105-fc4386677647`, with `/opt/ecure/current` pointing there. The allowlisted source archive contains 225 entries, 18,569,260 bytes, SHA-256 `fc43866776477c999d94a233fc68fb83e0d6d502f9249137cc6f48c21cfdc4a3`. All 13 final candidate routes returned 200 before promotion.

The active container is healthy and Caddy is active; app loopback binding, runtime configuration, TLS/firewall, bounded logs and restart behavior were retained. The preceding logo/interaction release remains available as stopped container `ecure-previous-20261105-46e19ef3f411`, with its image/release directory. The temporary photo candidate was removed after cutover. Approximately 40 GB remains free. See [current deployment status](../deployment/ORACLE_INSTANCE_STATUS.md).

Post-cutover public HTTPS verification passed: all 13 routes returned 200; homepage logo/subtitle/booking access and overflow passed at all eight widths; all six service photos decoded and their served original bytes matched the installed originals. Mobile services navigation and nursing booking prefill passed without a submission, HTTP redirected with 308, normal TLS validation succeeded, and no JavaScript page errors were observed. Fresh live desktop/mobile captures show the confirmed homepage image and preserve the existing dropdown animation. Cloud private-session access remains disabled with 503 as configured.
