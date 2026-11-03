# Phase Completion Report

**Phase:** 6 — Appointment Booking and Contact Forms

**Status:** APPROVED by the user's Phase 7 request; checkpoint `a1076d2` (verified local PostgreSQL/test-key scope; external-clock limitation below)

Authorization: The user requested Phase 6 before restarting Windows, retained local PostgreSQL and chose official Cloudflare test keys locally. Production submissions remain blocked until real credentials and approved business configuration exist. Documents supply requirements; the user's messages authorize this phase. Phase 7 is not started.

## A. Implemented Features

Appointment/inquiry POST endpoints now enforce strict server validation, consent, honeypot, origin/body limits, real Turnstile Siteverify, active service selection and business-timezone preferences. Atomic private PostgreSQL writes create random references with status `new`, redacted audits and retry receipts. Durable rate limits, concurrent duplicate protection, pending/error/retry/receipt/reset states and mode-specific privacy notices are implemented. A receipt acknowledges storage and does not confirm care or send email. Existing fonts, buttons, WhatsApp and hover behavior are preserved.

## B. Files Created or Modified

| Files | Role |
| --- | --- |
| `src/server/submissions/`, `src/app/api/` | Policy, schemas, verification, persistence/limits and POST boundary |
| Schema, `drizzle/0002*`, `0003*`, snapshots/journal | Additive fields, technical tables and RLS/restricted grants |
| Forms, submission hook/widget, shared types/values, styles | Real form states, duplicate/retry handling and compact mobile verification |
| Booking/contact/privacy pages, centralized copy, FAQ | Runtime mode DTOs and truthful processing/receipt notices |
| Startup/local-PG helpers, package/env example | Loopback-only test mode, environment loading and recovery readiness |
| Database/browser tests, QA tools/configs, CI | Real SQL/verification/browser tests and disabled-preview regression |
| README and architecture/requirements/testing/phase docs | Setup, privacy, decisions, evidence and limits |

See `docs/architecture/SUBMISSIONS.md` for the complete setup and HTTP/data contract.

## C. Technical Decisions

One deployment/profile/database remains the boundary. Only the public sitekey/configuration reaches the browser. HMACs protect receipt fingerprints, keys and rate identities; raw IPs, keys and tokens are not stored in technical tables. PostgreSQL locks serialize identical retries; request/audit/receipt records commit atomically, while rate counters commit independently so failed attempts count. Receipts last seven days. No runtime dependency, Redis, worker or mail system was added.

Disabled mode retains the frontend-only preview. Local-test requires exact official dummy credentials, loopback origins and a loopback listener. Live mode rejects dummy keys and demo profiles and validates verification hostname/action. Forwarding headers are untrusted by default; trusted proxy setup must strip/reset its selected header and prevent direct origin access.

## D. Tests Executed

| Test | Result | Evidence |
| --- | --- | --- |
| ESLint | PASS | Final `npm.cmd run lint` |
| TypeScript | PASS | `npm.cmd run typecheck`; build type checking |
| Unit/component tests | PASS | `npm.cmd test`: 32 tests, four files |
| Database/backend tests | PASS | `npm.cmd run test:db`: 42 tests (26 foundation + 16 submission); `.db-results/vitest.json`, `summary.json` |
| Fresh migrations/replay | PASS | Four migrations on three fresh databases; private eleven-table schema/grants |
| Atomicity/security | PASS within local scope | Rollback, concurrent identical requests, mismatched retries, disabled services, strict input/origin/body limits, safe failures, durable limits, forwarding spoof and private metadata access |
| Actual Turnstile verification | PASS for test keys | Passing/failing official secrets against real Siteverify; live binding branches separately tested with controlled responses |
| Production build | PASS | `npm.cmd run build`; two APIs and runtime booking/contact/privacy pages |
| Active browser/API integration | PASS with QA clock adjustment | `QA_TURNSTILE_CLOCK_FROM_HTTP=1` + `npm.cmd run test:submissions`: 9 tests; real widget/token/Siteverify/SQL; browser report/summary |
| Existing frontend E2E | PASS | `npm.cmd run test:e2e`: 12 tests; disabled forms send no data; POST 503/GET 405; admin unavailable |
| Responsive/accessibility | PASS within scope | Active forms/privacy at 320,375,390,430,768,1024,1440; scoped axe at 390/1440; actual mobile submissions and screenshot review; existing public/theme traversal |
| Fictional profile matrix | PASS | All three independent builds and nine browser tests; unchanged-source hash; default build restored; `.profile-results/matrix.json` |
| HTTP route/assets | PASS | Port 3101 smoke: 13 routes, 22 destinations, six image URLs, both 404 paths |
| Migration/runtime health | PASS | `db:check-migrations`; `db:generate` reports no schema changes; restricted development `db:check` after four migrations |
| Client/secret boundary | PASS | 11 client roots, 36 modules, 20 bundles; configured DB password/HMAC/Turnstile secret absent |
| Production dependency audit | PASS | Fresh `npm.cmd audit --omit=dev`: zero vulnerabilities; no dependency/lockfile additions |
| Supabase/hosted CI/live keys | DEFERRED / NOT TESTED | User chose local PostgreSQL; no managed, hosted CI or real-key deployment claim |

The environment returned Cloudflare challenge timestamps approximately fifteen hours ahead of the host, causing widget error 200100. The explicit QA option aligns only Playwright's browser clock to the official challenge HTTP Date and attaches both timestamps. Widget, tokens, Siteverify, database and server clock remain real. The application has no clock override or verification bypass. This is not an ordinary-clock browser pass.

## E. Bugs Found and Fixed

- Plain Node required the CommonJS-compatible default import of `@next/env` in the launcher.
- Cold PostgreSQL recovery exceeded the original wait; startup now polls up to ten minutes without weakening durability.
- Widget loading/expiry failures support retry; clock/cache failure has an actionable message and keeps sending blocked.
- Successful attempts discard in-memory personal payload/key and remain duplicate-guarded until explicit reset.
- Retry-After now reflects the actual rate window.
- Browser locators distinguish form alerts from Next's route announcer; FAQ assertions reflect current request/confirmation wording.
- Regression servers explicitly disable persistence; isolated CI role cleanup supports sequential test jobs without rotating an existing external role.

## F. Remaining Issues

Ordinary local preview verification remains blocked while challenge/device clocks disagree. The app explains this and fails closed. Verify consistent device/network time/cache behavior after the planned restart or on another network; no global clock change was made. Real-key/live behavior and trusted production proxy settings remain unverified.

Phase 7 follow-up: all nine active form tests subsequently passed with the ordinary browser clock, without the QA override. The earlier external clock/cache issue no longer reproduces; the paragraph above records the condition at the Phase 6 checkpoint.

Docker virtualization/WSL/VMP preparation needs the planned restart; Supabase remains deferred. Authentication, administration, notifications and production retention/backup/monitoring remain later phases. Phase 5's inherited moderate dev-tool audit findings were not changed; the fresh production audit is clean. No remote CI run, push or deployment is claimed.

## G. Acceptance Checklist

- [x] Real appointment/inquiry persistence and random unconfirmed references.
- [x] Server-side required/invalid/service/date checks and anti-spam/rate enforcement.
- [x] Duplicate clicks, concurrent submissions and lost-response retries produce one record.
- [x] Database failures roll back and show safe recoverable messages.
- [x] Mobile submissions, responsive/privacy/accessibility checks pass with the documented external-clock QA adjustment.
- [x] Existing frontend regression and browser secret boundary pass.
- [x] Three-profile matrix completed and default build restored.
- [x] Setup, processing, limits and test-key/environment constraints documented.
- [x] Production blocked for demo configuration; Phase 7 not started.

## H. Git Checkpoint

A dedicated local commit named `feat: complete phase six appointment and inquiry submissions` records this implementation and report; its hash is supplied in the completion response. Previous checkpoint: `78f037a`. Credentials, local databases and generated evidence remain ignored; unrelated user image untouched. No push/deployment.

## I. Approval Request

Phase 6 has completed its applicable verification checks. Do you approve moving to Phase 7?

The gate at `MASTER_DEVELOPMENT_PROMPT.md:902` requires: “STOP, REPORT, AND WAIT FOR APPROVAL.”
