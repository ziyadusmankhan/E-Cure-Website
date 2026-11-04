# Hosting cleanup — 4 November 2026

The Oracle upload is `dist/ecure-oracle-source.tar.gz`: 642,866 bytes (0.61 MiB), containing 211 archive entries. Regenerate it with `npm run package:oracle` after source changes. Upload only this archive and follow [ORACLE_CLOUD.md](ORACLE_CLOUD.md); do not upload the working directory. It is source for a Linux Docker build, not an already compiled application.

The tested `ecure:cleanup` runtime image is Linux/amd64, 394,457,019 bytes (376.18 MiB including its Node/Debian base). Oracle Ampere/arm64 is not verified. The image uses Next.js standalone tracing and runs as the unprivileged Node user. Build intermediates and caches require additional temporary build-host space; the source archive size is not the application's final installed size.

## Removed code

Import/reference checks identified the following unused modules and isolated developer samples. Their deletion does not remove the real staff dashboard.

- `/design-system` route and `src/components/design-system/showcase.tsx`.
- Fictional `src/components/admin/admin-shell.tsx`.
- Demo-only `src/components/ui/field.tsx`, `dialog.tsx`, `data-table.tsx` and `status-badge.tsx`.
- Demo-only `src/styles/components.css` and its global CSS import.
- Unreferenced adapters `src/data/faqs.ts`, `src/data/site-content.ts` and `src/config/navigation.ts`.
- The two sandbox test files. Valid contrast/theme and public responsive/reduced-motion cases were retained in `tests/unit/themes.test.ts` and `tests/e2e/interaction.spec.ts`.
- Unused `@radix-ui/react-navigation-menu` dependency and two now-unneeded transitive packages. Other direct dependency versions were retained.
- Obsolete sandbox flags in the example environment and public browser-test configuration; current architecture/README documentation was corrected.

The full-resolution source logo remains in the repository as a brand reference but is excluded from the upload and image. Required logo, icon and service photographs remain. The `/design-system` removal has an explicit 404 regression check.

## Preserved application and data

The operational `/admin` dashboard, staff login/MFA, access controls, appointments, inquiries, customers, CMS, media, forms, public routes and supported profiles remain. SHA-256 comparisons verified that 63 existing backend/API/migration/Supabase/environment files did not change during this cleanup, including `.env.local`.

The application PostgreSQL cluster under `.local/postgres-dev`, Auth provisioning records and local account-secret files were preserved and excluded from deployment. No migration, seed, account provisioning or production-data operation was performed. Database fixtures and migration modules remain because the maintenance scripts and integration tests import them; they are not unrelated code. Tests, migration history and associated design documentation remain in the maintenance repository and are excluded from the deployment.

## Local artifacts excluded from hosting

Before cleanup, major working-folder storage included `.local` (944.4 MiB), Windows `node_modules` (740.6 MiB) and `.next` (472.3 MiB), plus test reports/screenshots. These are baseline measurements, not claimed freed storage. `.local` includes persistent data as well as generated previews, so it must never be deleted wholesale.

Old stage 1–5 preview copies, the old dependency backup, the disposable test cluster and generated report/cache folders were identified for local removal. Automatic approval review rejected the guarded recursive deletion and the narrowed cache deletion with **“blocked by policy.”** Those recursive removals were not performed or bypassed. Old generated directories remain locally; `.dockerignore` and the archive allowlist exclude them from Oracle. Normal Next.js startup refreshed stale generated route types after the sandbox deletion.

## Verification

- ESLint: passed.
- Unit tests: 34 passed across 6 files.
- Linux Docker production compilation and TypeScript build: passed.
- Container HTTP checks: all 13 public pages returned 200; removed sandbox returned 404; icon and Linux Sharp image optimization returned valid images.
- Container staff routes remain present and fail closed with Auth disabled. Live production Auth/database configuration was not exercised.
- Image inspection confirmed no `.env.local`, `.local`, Git history, tests, QA, documentation, ESLint or Playwright packages. Runtime UID is 1000.
- Cloud startup guard rejected local-only Auth and submission modes with exit code 1.
- Backend source-boundary check: passed.
- Import audit found no unresolved application imports; CSS imports were checked as files. Remaining modules without application importers are used by database maintenance/test scripts.
- Archive allowlist/path validation: passed; no local credentials, databases, dependencies, tests or reports were packaged.
- Chromium browser suite against the Linux container: all 19 tests passed, including public accessibility, navigation, booking/contact behavior, images, metadata and responsive layouts.
- Final Windows production rebuild and standalone `npm run typecheck`: passed. A repeat backend boundary check passed against 21 client roots, 44 source modules and 26 browser bundles. The configured local app was restarted on loopback port 3000 after verification.

This cleanup prepares the application for deployment. It does not create an Oracle VM, publish a domain, configure production secrets or migrate the local database to Oracle. The isolated container checks used disabled external-service modes, not production bookings or a staff credential test.
