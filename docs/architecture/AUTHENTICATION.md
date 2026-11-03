# Phase 7 staff authentication and permissions

Local Supabase Auth is running and verified: all nine real password/MFA/session/permission browser tests pass against GoTrue v2.197.0. Native PostgreSQL remains the application database. The user-authorized first local Owner is provisioned; its generated password is in an ignored local file, and authenticator enrollment is left for the user at first sign-in. Phase 8 has not started.

## Local setup after the restart

Open Docker Desktop and wait for its engine, then run these commands from the project folder:

```powershell
npm.cmd run db:local:start
npm.cmd run db:local:migrate
npm.cmd run supabase:start
npm.cmd run auth:local:configure
npm.cmd run dev
```

Supabase startup output stays in ignored `.local/supabase/start.log` because the CLI can print local credentials. Configuration reads the local CLI status, preserves the existing session encryption key, writes local Auth settings to ignored `.env.local`, and stores the privileged provisioning credential only in `.local/supabase/provisioning.env`. Never share or commit these files. The runtime needs only the provider URL/public key, application database connection and session encryption key; it never needs an Auth admin/service key.

Visit http://127.0.0.1:3000/admin/login. Sign-up is disabled. Setup does not seed staff accounts or expose a public Owner bootstrap endpoint. The first local Owner was explicitly created at the user's request, with a generated password in ignored `.local/supabase/owner-access.txt`; its Windows ACL permits only the current user and SYSTEM. For additional accounts, use local Supabase Studio (http://127.0.0.1:54323) to create a confirmed staff Auth identity with a strong password, then link its UUID through the controlled CLI:

```powershell
npm.cmd run admin:provision -- --user-id REPLACE_WITH_VERIFIED_UUID --role owner --active true
```

Use `receptionist` for a Receptionist. Passwords and provider keys are never command arguments. The CLI checks the actual provider identity and deployment database before assigning access, protects the last active Owner from demotion/deactivation, revokes the identity's existing application sessions on changes and writes a structural system audit. Runtime SQL credentials cannot provision staff. Native PostgreSQL provisioning uses its protected local owner credential outside Next.js; a managed deployment supplies `DIRECT_URL` and `SUPABASE_PROVISIONING_KEY` only to this trusted CLI process.

The first sign-in enrolls a TOTP authenticator and verifies a six-digit code. Pending MFA setup expires after ten minutes. Later sign-ins challenge the existing factor. Lost-password/factor recovery is an administrator-assisted provider operation; there is no self-service recovery bypass or email flow in this phase.

## Session and provider boundary

The pinned official `@supabase/supabase-js` SDK performs password authentication, verified claims, fresh user lookup, refresh, MFA and local-scope provider sign-out. `persistSession`, browser URL detection and automatic background refresh are disabled. The application acts as a server-managed web session layer; no browser Supabase client, localStorage token or SSR cookie refresh proxy is necessary.

The browser receives a random 256-bit opaque HttpOnly cookie, SameSite=Strict, path `/`. Live mode uses HTTPS and the `__Host-` secure cookie prefix. Its hash indexes a private session row; the provider access/refresh pair is encrypted with AES-256-GCM and authenticated to that row's hash. Swapping rows or changing ciphertext fails. The key is server-only `ADMIN_SESSION_ENCRYPTION_KEY` (64 lowercase hex characters). Rotating it invalidates existing encrypted sessions; handle this deliberately.

Each protected request checks the session, absolute eight-hour expiry, 30-minute idle limit, current provider identity, current active database role and MFA assurance/factor state. An expiring provider token is refreshed under a database row lock so concurrent requests do not rotate the same token independently. Provider failures deny access and return safe recoverable messages. React's per-render cache avoids duplicate checks within a render; no principal is stored in a global/shared data cache.

Logout commits local session deletion before attempting provider sign-out. Copied application cookies fail immediately even if the provider is unavailable or its JWT is still valid. Provider-side logout/password changes performed outside this app can leave an already-issued JWT valid until provider expiry; the configured local JWT lifetime is 15 minutes. Provider user lookup and app role deactivation are checked on subsequent requests. This phase does not claim global instant revocation of every independently issued Supabase token.

## Permissions and HTTP routes

Staff mappings bind an exact verified UUID to the configured Auth issuer, role and active flag. User metadata, form fields, URL parameters and role headers cannot grant permissions. A Supabase account alone grants no staff access. The private database/profile identity must match this deployment.

| Role | Current permissions |
| --- | --- |
| Owner | Workspace and Owner-only permission policy |
| Receptionist | Workspace; Owner-only policy access denied |

Business/user administration and appointment/inquiry management are reserved for later approved tools. This phase provides the access boundary and a minimal workspace, not Phase 8 CRUD.

- `/admin/login`: public staff login; disabled/unavailable service fails closed.
- `/admin/mfa`: verified first-factor staff session only; enrollment/challenge.
- `/admin`: protected staff workspace.
- `/admin/access`: protected Owner policy page.
- `POST /api/auth/login`, `/logout`, `/mfa/enroll`, `/mfa/verify`: strict JSON, allowed Origin, bounded body, safe errors and private/no-store responses.
- `GET /api/admin/session`: verified staff projection (role/expiry only).
- `GET /api/admin/permissions`: Owner-only policy projection. No private record/user-list endpoints are exposed.

Protected pages and API handlers call the server authorization layer directly; layout visibility is not the only check. Redirect destinations are a fixed internal allowlist. Auth pages/APIs use frame protection, restrictive frame/form/base headers, no-referrer and no-store behavior. Credential/OTP fields are cleared after attempts and are never logged by application code.

Login limits are 20 attempts per client and five per normalized account per 15 minutes. MFA limits are 30 per client per 15 minutes and five per session per five minutes, with independent enrollment/verification buckets. Counters use the existing durable hashed technical table. Forwarded identity is untrusted by default, creating a conservative shared client bucket; only a properly secured deployment proxy may supply the explicitly trusted header. Logout has no provider-dependent rate barrier.

## Schema, isolation and configuration

Additive migrations 0004–0006 add private `administrative_sessions`, issuer-bound identity mappings, structural authentication audit actions and session RLS/grants. All twelve tables remain outside Supabase's exposed API schema; API-role access is revoked. Runtime cannot modify administrative identities or roles. If an actual co-located `auth.users` table exists, the security migration adds its FK. Separate native PostgreSQL cannot have a cross-database Auth FK, so provisioning and request-time verification enforce that relationship; no fake Auth table is created.

`ADMIN_AUTH_MODE` defaults to `disabled`. `local` requires loopback Auth/origins and binds the supplied startup wrapper to loopback. `live` requires HTTPS Auth/origins, real configuration and mandatory MFA; elevated provider keys are rejected by runtime policy. Local-only `ADMIN_REQUIRE_MFA=false` is an explicit development convenience, not a production bypass. Keep one independent deployment/database/Auth project configuration per business and environment. Provider recovery, backups and operational access procedures still need deployment-specific verification before launch.

## Verification

`npm.cmd run test:db` exercises real PostgreSQL with a controlled Auth provider: encrypted persistence, private privileges, role changes, issuer mismatch, forged cookies, concurrent refresh, idle/absolute/pending expiry, MFA binding, rollback, safe errors, rate limiting and logout replay denial. These tests do not prove the external Supabase service works.

After local Auth is configured, build and run `npm.cmd run test:auth`. It creates disposable application databases and confirmed ephemeral Auth identities, then tests real password/MFA login, first enrollment, invalid/unlinked/inactive users, Owner/Receptionist direct-page/API enforcement, expiry, logout replay, refresh and responsive/accessibility states. Its TOTP helper is test-only and checked against an RFC vector. Auth identities are removed during cleanup; secrets are not printed or written to artifacts. Run this harness sequentially with other DB/submission harnesses.

The existing frontend browser suite explicitly disables authentication and verifies an accessible unavailable login page and closed private routes. The real local suite now passes, including MFA enrollment, invalid/unmapped/inactive users, refresh, logout replay denial and direct Owner/Receptionist checks. The local Owner's first factor and enforced MFA setup were separately verified without enrolling a factor on the user's behalf. Test identities are removed during cleanup. CI is prepared but no hosted execution or pass is claimed. See the Phase 7 report for evidence and limits.

Primary references: installed Next.js authentication, cookies, route and headers guides; [Supabase verified user lookup](https://supabase.com/docs/reference/javascript/auth-getuser), [claims](https://supabase.com/docs/reference/javascript/auth-getclaims), [sessions/revocation](https://supabase.com/docs/guides/auth/sessions), [sign-out](https://supabase.com/docs/guides/auth/signout), [TOTP MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp).
