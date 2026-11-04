# E-Cure review and staff access

The E-Cure redesign uses the supplied artwork and a black, green and white presentation. Public pages and the protected staff workspace retain their existing routing, forms, service identities, permission checks and data contracts. Verification details are in `ECURE_STAGE_5_REPORT.md`.

## Configured staff app

Use **http://127.0.0.1:3000/admin/login** for the existing local staff account. Stage 5 starts this app with the workspace's original configuration and verifies that the sign-in button is enabled. Anonymous access to `/admin` still redirects to sign-in.

The existing Owner account remains active. Its credentials are stored in ignored `.local/supabase/owner-access.txt`; they are not printed in chat, copied into a report or replaced during the redesign. Complete the existing authenticator enrollment/verification when prompted. No public signup or default password is added.

This app uses the configured local development database. Appointment/contact submissions in its existing local-test mode really persist; use fictional details when exploring those forms. CMS editing and publication are also real operations. Published CMS content continues to take precedence over editable source defaults, so this app may display the existing publication until the Owner reviews and publishes new content through the editor.

Both the development PostgreSQL service and local Supabase must be ready. Docker/database recovery can take several minutes after an interrupted Windows shutdown. Stage 5 verifies service health without resetting data, changing account credentials or disabling MFA. For later restarts, follow the existing local setup sections in `README.md` and `docs/architecture/AUTHENTICATION.md`.

If a terminal previously set `ADMIN_AUTH_MODE=disabled` for a preview, use a fresh terminal for the configured app so that temporary process setting does not override `.env.local`.

## Visual review

The visual review server uses disabled CMS/auth/submission modes and displays source-default E-Cure content. It supports public-page review without saving requests. It cannot authenticate a staff account. The Stage 4 port-3500 link was this type of server.

Authenticated staff screenshots come from the real protected pages with temporary fictional accounts in a disposable test database. Those accounts are removed after each harness run. They are not reusable demo credentials and do not bypass sign-in.

Use **http://127.0.0.1:3600/** for the final public design preview. Authentication and saving are disabled there. Screenshots and the exact verification coverage are recorded in the Stage 5 report; final review captures are in ignored `.local/ecure-stage5/visual-qa/`.

## Verification commands

`npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run typecheck` and `npm.cmd test -- --maxWorkers=1` cover the production build and static/unit checks.

`node node_modules/playwright/cli.js test --config playwright.quality.config.ts` runs the public suite in Chromium, Firefox and WebKit. Install matching browser binaries with `node node_modules/playwright/cli.js install chromium firefox webkit` if needed. `npm.cmd run test:routes` checks routes, internal destinations, image URLs and error paths against `QA_BASE_URL`.

`npm.cmd run test:profiles` builds the three alternate profiles and restores the default build. Stop app servers using the same build directory before running it. `npm.cmd run test:db`, `test:submissions`, `test:auth` and `test:management` use fresh disposable databases; run these harnesses sequentially.

The redesign does not perform a hosted deployment, change the existing publication, or configure production credentials/domain settings. Review those separately before a live launch.
