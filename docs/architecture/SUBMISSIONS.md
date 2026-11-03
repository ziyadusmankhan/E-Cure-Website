# Phase 6 public submissions

Booking and contact forms can now persist requests through server-only Next.js POST handlers. A receipt acknowledges storage with status `new`; it does not confirm an appointment or send email. Authentication and administrative workflows remain Phase 7 onward.

## Modes and local setup

`SUBMISSIONS_MODE` defaults to `disabled`: the existing frontend demonstration works without a database or Turnstile. `local-test` accepts only loopback origins, requires Cloudflare's exact official passing test keys, binds the supplied dev/start launcher to 127.0.0.1 and refuses production hosting markers. Never tunnel or publicly proxy local-test mode. `live` requires real keys, HTTPS origins, and a non-demo, non-fixture business profile. Current demo profiles deliberately cannot enable live mode.

For local fictional requests:

1. Run `npm.cmd run db:local:start` and `npm.cmd run db:local:migrate`.
2. Initialize the matching demo catalog once with `ALLOW_DEMO_SEED=true` and `npm.cmd run db:seed` (see BACKEND.md). The existing local database uses `default`.
3. Set the local-test variables shown in `.env.example` in ignored `.env.local`. Generate `SUBMISSIONS_HMAC_SECRET` with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`; keep that output local. Never commit credentials.
4. Run `npm.cmd run dev` and open http://127.0.0.1:3000. Restart after changing server environment settings; rebuild after changing the public profile.

The current workspace is configured locally with the official test keys. Entries really persist, so use fictional details only. There is no email delivery or operational care arrangement. Stop the database with `npm.cmd run db:local:stop` before restarting Windows. An interrupted PostgreSQL startup may require crash recovery; the helper waits up to ten minutes without weakening durability.

## HTTP contract

`POST /api/appointments` and `POST /api/inquiries` require JSON, an allowed exact `Origin`, and a UUID `Idempotency-Key`. There are no public read endpoints. GET is 405; disabled mode returns 503. Responses use `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.

Both strict schemas require consent, a Turnstile token and an empty honeypot. Appointments validate configured/published/active services, name, normalized phone, optional email, visit format, valid calendar date, known time preference and a bounded arrangement inquiry. Dates use the database business timezone, from today to 365 days ahead, excluding expired windows today. These are preferences, not availability guarantees. Inquiries validate name/email, a known topic code and a bounded message. Unknown fields, invalid media/encoding and bodies exceeding 16 KiB are rejected.

Success is 201 for a new receipt and 200 for an identical retry: `{reference, status: "new", requestId}`. References contain 96 random bits with REQ/INQ prefixes. No customer UUID, submitted details or SQL is returned. Errors have safe codes and a request identifier; the client translates known codes into recoverable messages. Rate limits return an actual bucket expiry in `Retry-After`.

## Verification, transactions and retry behavior

The server POSTs to Cloudflare Siteverify with an eight-second timeout. Local-test requires the exact dummy token and a real successful test-key response. Live verification additionally checks action and hostname. Network/provider failures fail closed. Secret keys never reach the client; only the public sitekey is passed to the widget.

The widget loads the official script, supports expiry/error/retry and a compact mobile layout. A failed check disables sending. A clock/cache error explains the device/network issue; it is never bypassed by the application. See [Cloudflare testing keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) and [error codes](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/).

The request transaction serializes identical keys with a PostgreSQL advisory lock, rechecks idempotency and service state, verifies Turnstile, then atomically inserts the customer/appointment or inquiry, redacted audit events and receipt. Failure rolls back all those records. The browser keeps the same key for the same content after uncertain responses and allows safe retry. Double-clicks are guarded, pending buttons are disabled, and completed attempts discard personal details and remain guarded until explicit reset. A retry with different content conflicts. Receipt reuse avoids consuming verification tokens or rate budget again; concurrent initial attempts may consume rate budget while still producing only one record.

Durable fixed-window counters limit each endpoint to six attempts per client per 15 minutes and three per normalized contact per hour. They commit separately so failed submissions still count. By default forwarding headers are untrusted and all requests share a conservative client bucket. Only explicitly configured `cf-connecting-ip` or `x-real-ip` is accepted, and only where a trusted proxy strips/resets that header and prevents direct origin access. `x-forwarded-for` never supplies identity. This origin/consent/Turnstile/limit combination is a public form boundary, not authentication.

## Data and privacy

Additive migrations 0002/0003 add appointment inquiry text, inquiry reference/consent, `submission_receipts` and `submission_limits`. All eleven application tables remain in private `healthcare`, with RLS and no Supabase browser/API-role access. The restricted app role can insert/read/delete receipts, but cannot update them; technical counter permissions allow atomic upserts. Request/inquiry deletes remain prohibited. Applied migrations are immutable.

Receipts expire after seven days. HMAC fingerprints, key hashes and rate identities use the server-only random secret; raw IPs, raw idempotency keys and tokens are not stored. Rotating that secret invalidates retry matching and rate identity, so handle it as an operational change. Bounded opportunistic cleanup removes expired technical rows, not customer/request records. Local fictional records remain until an explicit controlled reset; this phase does not implement a production retention scheduler.

Forms hold entries in component memory and clear them after success/reset. They do not use localStorage/sessionStorage or emit analytics/console payloads. React escapes displayed values. Privacy notices explain real local persistence, consent and Cloudflare processing. Only request IDs, operation names and safe codes are logged on server errors; routine submitted contents are not logged. Database/operator logs must also remain private.

## Verification and limits

Run `npm.cmd run test:db` and `npm.cmd run test:submissions` sequentially: they use a dedicated test cluster and isolated databases, never the persistent development database. The browser harness requires its own build first and verifies real test-key Siteverify requests, SQL persistence, rollback, retries, double-clicks, invalid requests, limits and responsive/accessibility states. CI uses a dedicated PostgreSQL service; a hosted CI pass is not implied by local results.

This environment returned challenge HTTP timestamps roughly fifteen hours ahead of its host clock, producing Turnstile 200100. For this specific network only, an explicit QA option aligns the Playwright browser clock to the official challenge response header:

Phase 7 follow-up: challenge and host times are now close, and all nine submission browser tests passed without this option. The earlier issue no longer reproduces. Keep the option for explicit diagnosis only when the clock/cache error actually occurs.

```powershell
$env:QA_TURNSTILE_CLOCK_FROM_HTTP = "1"
npm.cmd run test:submissions
Remove-Item Env:QA_TURNSTILE_CLOCK_FROM_HTTP
```

Each adjusted test attaches both timestamps. This does not mock the widget, token, Siteverify, database or application server clock. It is not enabled in the application or CI. Ordinary preview browsers still need consistent device/network time; changing global Windows time is not part of this implementation.

Real-key/live hostname/action behavior, a managed Supabase runtime, real deployment proxy configuration, production operations/retention, auth, administration and email delivery are not claimed by these local tests. Complete their respective approved phases before launch.
