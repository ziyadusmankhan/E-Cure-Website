# Phase Verification Report

**Phase:** 7 — Admin Authentication and Permissions

**Status:** TESTING — real local Supabase Auth verification awaits Windows restart/Docker startup.

Authorization: The user explicitly requested Phase 7 and selected local Supabase after restarting Windows. Application data remains in native PostgreSQL. Phase 6 approved checkpoint: `a1076d2`. Phase 8 is not started.

## A. Implemented Features

Supabase Auth integration, staff login/logout, TOTP MFA setup/challenge, protected staff layouts/pages, Owner/Receptionist permissions, direct API authorization, strict internal redirects and safe errors. Opaque HttpOnly sessions keep encrypted provider tokens in private PostgreSQL. Idle/absolute/pending-MFA expiry, serialized refresh and local logout revocation are implemented. Controlled issuer-bound staff provisioning and unavailable-service UI are included. Authentication defaults to disabled until a real service is configured.

## B. Files Created or Modified

| Files | Role |
| --- | --- |
| `src/server/auth/` | Policy, cryptography, Supabase adapter, private sessions, HTTP/page guards |
| `src/app/admin/`, `src/app/api/auth/`, `src/app/api/admin/` | Login/MFA/workspace/Owner pages and protected endpoints |
| `src/components/admin/auth-forms.tsx`, styles/types | Accessible forms, pending/error/logout states and permission types |
| Schema/migrations 0004–0006 and snapshots/journal | Private sessions, issuer mapping, RLS/grants, structural authentication audits |
| Auth/local-Supabase/provisioning scripts and env example | Local setup, private credentials and controlled identity-to-role mapping |
| `qa/auth-fixture.ts`, `qa/totp.ts`, auth browser config/tests, DB tests | Disposable real-Auth fixtures, TOTP vector, actual provider suite and controlled-provider SQL security suite |
| Package/lockfile, Next headers, Supabase config, CI/QA configs, docs | Pinned SDK, scoped security headers, prepared Auth service/CI, setup and verification evidence |

## C. Technical Decisions

The official `@supabase/supabase-js` 2.118.0 SDK is server-only; no browser Auth client or localStorage tokens are used. Provider identities must be confirmed, non-anonymous and explicitly mapped to the exact issuer and active private role. Metadata and client headers cannot grant access. Runtime SQL cannot provision staff or change roles.

Random opaque cookies index hashed session IDs; provider tokens use AES-256-GCM with session-bound authenticated data. Live cookies require HTTPS, HttpOnly, Strict SameSite and the __Host prefix. Every protected page/API independently authorizes access; layout visibility alone is insufficient. Sessions expire after eight hours or 30 idle minutes, and incomplete MFA after ten minutes. Logout commits local revocation first so copied cookies fail even if provider logout is unavailable. Provider-side revocation outside this app remains bounded by JWT expiry; see the architecture document.

Native PostgreSQL cannot reference a separate Auth database with a foreign key. Controlled provisioning verifies the actual identity, and each request verifies provider identity/issuer plus the private mapping. A real co-located `auth.users` FK is added conditionally where available; no fake Auth table exists.

Current protected operations are workspace and Owner-only permission policy reads. Operational appointment/content/user-management interfaces remain Phase 8. Setup, trust, recovery and retention limitations are documented in `docs/architecture/AUTHENTICATION.md`.

## D. Tests Executed

| Test | Result | Evidence |
| --- | --- | --- |
| ESLint | PASS | Final formatted-source `npm.cmd run lint` |
| TypeScript | PASS | `npm.cmd run typecheck`; successful production build type checking |
| Unit/component tests | PASS | 32 tests, four files |
| Database/backend tests | PASS with controlled Auth provider | 62 tests: 26 foundation + 16 submissions + 20 Auth/security; real isolated SQL; `.db-results/vitest.json` |
| Fresh migrations/replay | PASS | All seven migrations on four fresh databases; twelve private RLS tables; current development database migrated and checked |
| Auth/security/permissions | PASS within controlled-provider scope | Role changes/deactivation, issuer mismatch, forged cookie denial, idle/absolute/pending expiry, MFA factor binding, serialized refresh, rollback, rate limits, encrypted storage/tamper rejection, private grants and logout replay denial |
| Real Supabase password/MFA/session E2E | NOT RUN | `npm.cmd run test:auth` reports executed=false because local Auth is unconfigured; `.db-results/auth-summary.json` |
| Production build | PASS | New dynamic staff pages and six Auth/admin endpoints compile; all public routes preserved |
| Existing frontend + disabled login E2E | PASS | All 13 Chromium tests; login unavailable/fail-closed state, headers, redirects, seven widths and scoped axe checks |
| Active appointment/contact regression | PASS without clock adjustment | All nine real widget/API/SQL tests passed with the ordinary browser clock; the earlier challenge-clock problem no longer reproduces |
| Fictional profile matrix | PASS | All three independent builds, nine browser tests, unchanged source hash and restored default build |
| Client/secret boundary | PASS | Restored-build scan: 12 client roots, 37 modules, 22 browser bundles; configured secrets absent |
| HTTP smoke/preview | PASS | 13 public routes, 22 destinations, six image URLs and both 404 paths; login preview 200 with private/no-store and frame protection |
| Production audit | PASS | `npm.cmd audit --omit=dev`: zero vulnerabilities; eight SDK packages added, no existing dependency versions changed |
| Hosted CI/live deployment | NOT TESTED | Local Auth steps prepared; no remote CI or managed production pass claimed |

The controlled-provider suite tests the application boundary but does not substitute for the real Supabase suite. Its twenty tests are not counted as real provider sign-in/MFA success.

## E. Bugs Found and Fixed

MFA verification responses return relative expiry rather than the password-login session's absolute expiry; the adapter now handles both formats. Token decoding rejects non-canonical Base64, malformed IV/tag lengths and cross-session swaps. Controlled refresh is serialized and persisted even when an entered MFA code fails. Legacy endpoint tests now expect a guarded login redirect rather than the pre-Phase-7 admin 404. Setup reads the installed CLI 3 JavaScript launcher; credential-bearing startup output is kept outside application logs.

## F. Remaining Issues

Docker was unavailable on the current machine, and there is no configured Supabase service. The user chose local Supabase after restarting Windows. Actual password login, invalid credentials, real MFA enrollment/challenge, provider refresh and logout must pass `test:auth` against that service before Phase 7 can be marked passed. No real staff identity or default password was created. No global clock change, Windows restart, hosted project or deployment was performed.

Inherited Phase 5 moderate dev-tool audit findings remain; production audit is clean. Administrator-assisted account/factor recovery and production proxy/operations require deployment-specific verification. The currently unavailable login screen is intentional fail-closed behavior, not a completed operational sign-in setup.

## G. Acceptance Checklist

- [x] Supabase adapter, login/MFA/logout UI and server-managed sessions implemented.
- [x] Owner/Receptionist guards enforce direct page/API access independently of UI visibility.
- [x] Controlled-provider security, expiry, refresh, revocation and rollback checks pass with real SQL.
- [x] Existing public/form regression and unavailable login responsive/accessibility checks pass.
- [x] Setup, credentials, provisioning and unverified scope documented.
- [ ] Real local Supabase login/MFA/refresh/logout and role browser suite passes.
- [x] Final profile restore and formatted-source checks pass; checkpoint recorded below.
- [ ] Phase 7 exit criteria satisfied; Phase 8 approval requested only after real verification.

## H. Git Checkpoint

A local commit named `feat: implement phase seven staff authentication pending Auth verification` preserves current work; its hash is supplied in the response. It is an implementation checkpoint, not a passed-phase claim. Previous checkpoint: `a1076d2`. Local credentials, generated evidence and database directories remain ignored; the unrelated user image is untouched. No push/deployment.

## I. Required Next Step

Restart Windows to activate the saved virtualization/WSL changes, then open Docker Desktop. Continue with local Supabase startup/configuration and the actual Auth suite. Phase 7 remains TESTING; do not proceed to Phase 8 or claim completion yet.
