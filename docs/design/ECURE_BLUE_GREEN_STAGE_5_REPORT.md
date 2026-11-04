# E-Cure blue/green redesign — Stage 5

Status: complete — 5 November 2026 (Asia/Karachi). The final source and Oracle HTTPS preview passed the checks recorded below. The baseline contains 218 application/asset/test/config files, including 64 protected backend/configuration files. Existing uncommitted work from earlier development/redesign stages is outside this stage's diff. Machine-readable timestamps use UTC.

The subsequent client request for a logo subtitle and interaction refinements has its own [change and verification record](ECURE_LOGO_AND_MOTION_REFINEMENT.md). This report preserves the Stage 5 results and release at that milestone; [deployment status](../deployment/ORACLE_INSTANCE_STATUS.md) identifies the latest release.

## Scope and corrections

This stage checks responsiveness, keyboard interaction, accessibility, SEO, public regression, real local submission/auth/admin workflows, alternate-profile isolation and the Oracle preview. It preserves the configured CMS publication and pending draft, existing API/schema/auth contracts, and client-specific theming.

The responsive audit identified one image-quality mismatch: the E-Cure hero stacks to full width through 980px, but its image `sizes` hint still switched to half width after 760px. At a fresh 768px live navigation, the browser requested a 640px image for a 768px slot. The source hint is corrected for E-Cure to `(max-width: 980px) 100vw, 48vw`; alternate clients retain their original hint. A browser regression checks the requested candidate against the actual display width/density on phone, tablet and desktop sizes.

Alternate-profile tests now include the missing 1280px width, exercise all route layouts at all eight requested widths and assert that E-Cure presentation/fonts/inline tokens do not leak. Active design-system/white-label/README documentation is updated to the current blue/green identity, and a current handoff distinguishes configured local staff access from disabled cloud/source previews.

## Verification record

- PASS: lint on the final changed source/tests; 39 unit tests in 7 files. The image-only page change does not alter the unit-tested modules.
- PASS: independent builds/browser checks for all three alternate profiles, 9 browser cases in total; the complete matrix was repeated after the image correction and confirmed source files were unchanged during the matrix.
- PASS: final default production build restored, standalone TypeScript and client/server boundary checks (21 client roots, 45 source modules, 26 browser bundles).
- PASS: 81 database regression tests on fresh isolated databases; harness cleanup completed.
- PASS: local and Oracle route smoke checks — 13 routes, 21 internal destinations, 9 image URLs and both tested 404 paths.
- PASS: final sequential real-backend browser harnesses — 9 submission, 9 authentication and 5 management tests, including successful cleanup.
- PASS: final public three-engine suite, 72 cases (24 each in Chromium, Firefox and WebKit), no failed, skipped or flaky cases. The pre-correction run was stopped so verification targeted the corrected build.
- PASS: corrected Linux/amd64 candidate image built on Oracle, with production compilation/TypeScript/route generation; all 13 candidate public routes returned 200. A fresh candidate browser confirms the 768px hero now selects an 828px image.
- PASS: static migration consistency check (`npm run db:check-migrations`); no migration edits.
- PASS: post-cutover public HTTPS smoke: all 13 public routes returned 200; the homepage passed all eight widths, official logo/favicon byte comparisons, mobile services navigation and booking prefill. The live 768px hero selects 828px, HTTP redirects with 308, normal certificate validation succeeds, and no JavaScript page errors were observed.
- PASS: read-only saved CMS comparison — unrelated published/draft content preserved, draft revision 8 still pending over publication 7; all 64 protected backend/configuration files unchanged.

These are **104 browser test cases** in total: 72 public, 9 alternate-profile, 9 real submission, 9 real authentication and 5 real management cases, plus separate deployment/visual smoke checks. There are also 39 unit and 81 database tests. The default local build and all three alternate-profile builds passed; the Oracle candidate was independently built on Linux/amd64.

## Responsive, accessibility and SEO findings

Public route layouts, homepage/logo/navigation, service cards and booking controls were exercised at **320, 375, 390, 430, 768, 1024, 1280 and 1440 CSS pixels**. The real local staff management harness also checks responsive staff forms/tables across these widths. Keyboard tests cover the skip link, desktop services, mobile modal focus/scroll restoration and FAQ interaction. Automated axe checks report zero violations under the selected WCAG A/AA tags on public routes at 390/1440px; authenticated staff accessibility checks run at 320/1440px. These are scoped automated checks, not a certification.

Metadata checks confirm one main H1, unique titles, descriptions, Open Graph metadata, language and viewport declarations. The preview correctly stays `noindex`, robots-disallowed and without indexed sitemap entries until the production profile/canonical URL is approved. Missing pages/services and the removed design-system route return 404.

Fresh representative homepage screenshots were captured in each engine at 390, 768 and 1440px. Reviewed captures show intact official artwork, visible booking access, coherent image cropping and no horizontal overflow. Windows WebKit renders the type visibly lighter than Chromium/Firefox in these captures; actual iOS/macOS Safari and physical-device appearance remain unverified. A first supplementary screenshot run timed out while decoding an image during repeated same-page resizing; the fresh-context capture run completed all nine views, and the main image-loading suite passed in all three engines.

The initial 9-case submission browser run passed its assertions but cleanup failed because its temporary-server lifetime overlapped the database-unit harness. That was an orchestration error. The unit harness then completed successfully; the exact leftover submission test database was verified idle and removed using the existing isolated test cluster. The submission/auth/management harnesses were rerun strictly sequentially, all exited successfully and completed cleanup; no backend source or configured application data was changed to resolve the overlap. No unresolved functional regression was found by the executed checks.

## Oracle release

The healthy candidate was promoted to `ecure:20261105-c3dcbde7beec`, with `/opt/ecure/current` pointing to `/opt/ecure/releases/20261105-c3dcbde7beec`. The allowlisted source archive is 7,037,442 bytes, SHA-256 `c3dcbde7beecf8aa9195d04ab9c986802d32f5b31dc6d4ea350a7470cb90816f`. The previous blue/green release is retained as stopped container `ecure-previous-20261105-f3e9ee22a32a`, alongside its image/release directory. The older initial rollback also remains available. The temporary candidate and its local SSH tunnel were removed/stopped after cutover.

The live container is healthy, Caddy is active and roughly 41 GB remains free. The existing loopback-only app binding, restart policy, bounded logs, TLS/firewall and root-only runtime configuration were retained. Cloud CMS/Auth/submissions remain disabled; local account details, databases and CMS backups were not transferred. See [current deployment status](../deployment/ORACLE_INSTANCE_STATUS.md).

## Files changed

- `src/app/page.tsx`: E-Cure-only responsive hero image hint; the alternate-client branch is unchanged.
- `tests/e2e/profiles.spec.ts`: all eight widths and explicit client-theme isolation checks.
- `tests/e2e/responsive-images.spec.ts` (new): actual selected image-candidate coverage on phone/tablet/desktop in each public browser project.
- `README.md`, `docs/architecture/DESIGN_SYSTEM.md`, `docs/architecture/WHITE_LABEL.md`: current branding, review links, client configuration and platform documentation.
- `docs/design/ECURE_BLUE_GREEN_HANDOFF.md` and this report (new): current review/operational boundaries and exact verification record.
- `docs/deployment/ORACLE_INSTANCE_STATUS.md`, `docs/deployment/ORACLE_BLUE_GREEN_UPDATE_2026-11-05.md`: current Stage 5 release/evidence links, with the initial Stage 4 deployment record retained as history.

Ignored `.local/ecure-bluegreen-stage5/` holds the captured baseline, browser configurations/results, image audit evidence, copied harness/profile summaries and final verification script. Test-only data remains in the guarded harness; it is not deployment content.

## Known scope limits

Automated browser checks do not constitute physical-device testing, accessibility certification or field performance measurements. Production cloud authentication/submission delivery cannot be claimed while those services remain disabled/unconfigured. No backend routes, schemas, migrations, authentication/authorization, API contracts, appointment processing, environment settings or business logic were changed in Stage 5. The remaining production configuration is described in [the handoff](ECURE_BLUE_GREEN_HANDOFF.md).
