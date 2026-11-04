# E-Cure blue/green redesign — Stage 2

Status: complete locally; awaiting approval for Stage 3. This report records changes against the Stage 1 audit baseline, not against the repository's older Git HEAD. Earlier uncommitted website/deployment work is outside this stage.

## Delivered scope

The official supplied logo is now the E-Cure preset's default artwork in the shared public header, drawer, footer and staff brand component. The original 1536 × 1024 JPEG is copied byte-for-byte. CSS frames its surrounding white margins while retaining the complete artwork and its proportions; it has not been redrawn, recolored or AI-generated. A 64 × 64 PNG favicon is resampled from the same supplied artwork on white. Known old static E-Cure logo references resolve to the new asset, while a custom CMS logo remains authoritative. Old assets remain available for existing content references.

The client-specific presentation preset now supplies navy, blue, green, white/off-white, body, muted and control-border colors. Both server rendering and client navigation apply the same preset. Existing CMS primary/secondary overrides retain their precedence. Persisted theme names, profile IDs, schemas and CMS/API contracts remain unchanged. Other profiles receive no E-Cure preset colors, and leaving this presentation clears its injected variables.

Manrope headings and Inter body typography are retained. Shared presentation now includes a white public navigation bar, navy utility bar/footer, green booking actions, navy headings on light surfaces, visible form boundaries, keyboard focus, restrained service cards and a deliberately sized mobile brand/navigation/booking row. The official artwork remains on a white plate where the existing staff interface uses a dark surface.

The green used for white button labels is `#247D29` (computed contrast 5.20:1 against white). The brighter `#329B32` remains an accent. Existing dark page sections retain readable heading colors while awaiting their Stage 3 composition redesign.

## Files changed

| File | Stage 2 change |
| --- | --- |
| `src/config/client-presentation.ts` (new) | Configurable E-Cure palette, shared token application and CMS precedence |
| `src/config/branding.ts` | Official asset paths, source dimensions/framing and legacy/custom artwork resolution |
| `src/components/shared/brand.tsx` | Intact official artwork, proportional framing, custom-logo compatibility |
| `src/components/website-provider.tsx` | Preserve preset/CMS token behavior through client navigation |
| `src/app/layout.tsx` | Apply the same presentation preset during server rendering |
| `src/app/icon.ts` | Use the official-artwork-derived E-Cure favicon |
| `src/styles/ecure.css` | Client-scoped foundations, shared controls, branding, header/drawer/footer and responsive states |
| `public/images/branding/ecure-official-logo.jpg` (new) | Exact supplied official logo |
| `public/images/branding/ecure-official-icon.png` (new) | Favicon resampled from the official artwork |
| `tests/unit/client-presentation.test.ts` (new) | Contrast, preset isolation/CMS precedence, artwork identity and custom/legacy logo behavior |
| `tests/e2e/branding.spec.ts` | Official artwork/frame, preset persistence, white navigation and shared-logo regression checks |
| `tests/e2e/public-redesign.spec.ts` | Assert the updated favicon bytes |
| `docs/design/ECURE_BLUE_GREEN_STAGE_2_REPORT.md` (new) | This handoff record |

Ignored `.local/ecure-bluegreen-stage2/` contains the baseline, asset preparation metadata, verification script, Playwright config/results and review captures. Normal generated Next.js build/type artifacts were refreshed. No dependency or environment file was edited.

## Executed verification

| Check | Result |
| --- | --- |
| `npm run lint` | PASS — no errors or warnings |
| `npm test -- --maxWorkers=1` | PASS — 38 tests, 7 files |
| `npm run build` | PASS — production compilation, TypeScript and route generation; rebuilt after the final CSS correction |
| `npm run typecheck` | PASS |
| `npm run test:boundaries` | PASS — 21 client roots, 45 source modules, 26 browser bundles |
| `npx playwright test --config .local/ecure-bluegreen-stage2/playwright.config.ts` | PASS — final run: 21 Chromium tests, no failures, skips or flaky results; 2.5 minutes |
| `node .local/ecure-bluegreen-stage2/verify-stage.mjs` | PASS — 8 expected baseline files changed, 4 expected application/test/assets added, no unexpected changes, all 64 protected files unchanged |

The production browser suite covers the 13 existing public routes at **320, 375, 390, 430, 768, 1024, 1280 and 1440px**, including overflow, public logo proportions, booking visibility, navigation, image loading, service destinations and page completeness. Added shared-artwork checks cover the footer and staff login at all eight widths, including the previously missing 1280px login-logo case. The existing disabled-login whole-layout test still covers seven widths; this is not authenticated admin-table coverage.

Mobile/desktop automated accessibility checks pass on the public routes and disabled login. Keyboard services menus, mobile focus trapping/restoration, reduced motion, skip links, metadata, preview indexing, booking service prefills, review/edit behavior and truthful demonstration-form completion also pass. Requests in this suite use disabled CMS/auth/submissions and do not create real appointments or inquiries.

Visual inspection of rendered 1440px desktop, 390px mobile and 1440px staff-login captures confirmed the official artwork, readable sizing and shared foundation changes. It identified a competing admin image `max-width` rule; the official artwork selector was corrected, production rebuilt, and the new footer/login frame regression plus the full browser suite passed afterward. No unresolved regression was found in the executed checks.

The original logo SHA-256 remains `5b1a874e6bbc81cd1fb3c085d05eaacf38ae39bc670604beff4eccff4367814b`. Machine-readable parity and final browser counts are in `.local/ecure-bluegreen-stage2/verification-summary.json`; detailed browser evidence is in `browser-results.json`, `browser-results/` and `browser-report/` in the same directory.

## Protected behavior and remaining stages

All 64 captured protected backend/auth/API/database/migration/deployment/environment files match the Stage 1 baseline. Route handlers, proxy, authorization, database schemas, authentication logic, appointment processing and business rules were untouched. No credentials, dependencies, contact information, claims, statistics or testimonials were added. Local environment files were not changed, and no production server, Oracle resource, CMS document or database record was updated.

This stage does **not** complete the light public-page redesign. Existing dark hero/page-intro/about compositions, current content layout and existing photography are deliberately still present for the separately approved Stage 3. Supplied Islamabad/physiotherapy photography and the complete new homepage composition remain Stage 3 work. Operational staff palette/table refinement remains Stage 4.

Real authenticated Owner/Receptionist/MFA flows, CMS publication, live submission delivery, alternate-profile browser builds, Firefox/WebKit and physical devices were not exercised in Stage 2. Unit checks cover preset isolation and custom CMS color/logo compatibility; the broader cross-profile/browser and real-backend matrix remains later-stage work.

## Review and next approval

Review the new foundations locally at **http://127.0.0.1:3602/**. This is a separate demonstration server with CMS, auth and submissions disabled in its process only; its login is intentionally unavailable. The configured local application is restored at **http://127.0.0.1:3000/** with its existing environment. The live Oracle website has not received this redesign.

Approve Stage 3 to redesign all existing public pages using these foundations, the supplied photography, the exact requested homepage headline and the white/navy/blue/green composition. Stage 3 approval is separate from publishing or deploying.
