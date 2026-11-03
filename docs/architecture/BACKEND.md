# Phase 5 database and backend foundation

Phase 6 extends this foundation with public submission handlers, two technical tables and migrations 0002/0003. See [SUBMISSIONS.md](SUBMISSIONS.md) for the current HTTP, verification, privacy and retry contract.

Phase 7 implements and verifies local Supabase Auth, opaque server-managed sessions, MFA and Owner/Receptionist authorization with migrations 0004–0006. All nine real Auth browser tests pass; see [AUTHENTICATION.md](AUTHENTICATION.md). Application data remains in native PostgreSQL; no managed database migration is implied.

One independent deployment and database per client. PostgreSQL access lives in `src/server/` and uses Drizzle ORM 0.45.4, Drizzle Kit 0.31.11 and Postgres.js 3.4.9. These versions are pinned in the lockfile. No request-based tenant switching is introduced.

The user explicitly chose **local PostgreSQL for now** when Docker Desktop could not start Supabase. After the user's restart, Docker 29.9.2 and the CLI 3.0.0 local stack started successfully. GoTrue v2.197.0 is verified for authentication; application data remains in native PostgreSQL 18.4. No hosted project connection or managed application-database verification is claimed. CI is configured for PostgreSQL 17 but has not been executed remotely.

## Local development

Installed PostgreSQL binaries are required. On Windows the helper finds versions 18/17/16/15/14 under `C:/Program Files/PostgreSQL`; elsewhere it uses `pg_config --bindir`. Set `PG_BIN` if necessary. Match the binary major version to an existing data directory; do not perform an in-place major upgrade with this helper.

```powershell
npm.cmd run db:local:start
npm.cmd run db:check
npm.cmd run dev
```

`db:local:start` creates a private workspace cluster under ignored `.local/postgres-dev/`, listens only on `127.0.0.1:55433`, initializes `healthcare_development`, applies all reviewed migrations, and verifies the restricted runtime connection. It uses SCRAM password authentication and generated random credentials. It creates ignored `.env.local` with **only** `DATABASE_URL` if that file does not exist; an existing environment file is preserved. A generated runtime connection is also available in ignored `.local/postgres-dev/runtime.env`. No passwords are printed.

Migration-owner credentials remain under `.local/postgres-dev/`, outside the Next.js runtime environment. Do not share, commit or upload `.local/`, `.env.local` or local database logs. Unix file creation requests mode 0600; Windows inherits the workspace/user account's filesystem ACLs. This local setup is for development, not a production database service or backup strategy.

```powershell
npm.cmd run db:local:migrate   # apply later reviewed migrations, preserving data
npm.cmd run db:local:stop      # stop this workspace cluster, retaining data
```

The helper does not modify the computer's existing PostgreSQL services, port 5432 databases or their credentials. Tests use a different workspace cluster and credentials on port 55432.

## Demo fixtures

```powershell
$env:ALLOW_DEMO_SEED = "true"
npm.cmd run db:seed
```

Only a configured demo profile is accepted; `NODE_ENV=production` forbids CLI seeding. The default uses existing placeholder branding and the original six active services; three fictional profiles are also supported. All catalog entries are retained with appropriate enabled/published flags, and six page metadata/content drafts are inserted. This is an initial content scaffold, not a database rendering conversion of the public pages.

Seeding is transactional, serialized and insert-only. Repeating the same profile does not overwrite edited records. A database with another profile identity is rejected, including concurrent attempts. No customer, inquiry, appointment or administrative identity is seeded. Administrative role definitions come from the migration, not from fake staff accounts.

For this phase the development database was seeded with `default`. Changing the frontend demo selector still works because public pages continue using Phase 4 configuration. Before activating real backend calls in Phase 6, match the selected deployment profile to its own initialized database. Never point different client deployments at the same database.

## Relational model

All twelve application tables live in the private `healthcare` schema:

| Table | Integrity and purpose |
| --- | --- |
| business_settings | Singleton row, profile identity, business type, name, timezone, theme and public contacts |
| services | Unique validated slugs, bounded public content blocks, enabled/published flags, nonnegative display order |
| pages | Unique slugs, typed plain-text paragraph/bullet blocks, metadata and draft/published state |
| customers | UUID, normalized phone, optional normalized email, optional consent timestamp; indexed identifiers |
| appointments | Unique random reference; customer/service foreign keys; visit mode, valid date, time preference and constrained status |
| contact_inquiries | Bounded contact fields/message, validated status, indexed status/creation time |
| administrative_roles | Owner and Receptionist definitions only |
| administrative_users | Inactive-by-default verified Auth UUID/issuer mapping and role FK; controlled provisioning |
| audit_events | Nullable actor FK, constrained action/entity, IDs, timestamp and structural metadata only |
| submission_receipts | Hashed idempotency/fingerprint and minimal request receipt; seven-day technical expiry |
| submission_limits | Hashed durable fixed-window rate counters |
| administrative_sessions | Hashed opaque cookie identifiers, encrypted provider tokens, absolute/idle lifetime |

Appointment references use 12 cryptographically random bytes and a database unique constraint. Requests start at `new`, with no confirmed time. `confirmed`/`completed` records require an actual confirmation timestamp at database level; staff transitions and scheduling logic belong to later phases. No appointment hard-delete service exists, and the runtime role has no appointment/inquiry DELETE privilege. Referenced services/customers cannot be deleted. Audit actor deletion uses SET NULL; administrative identity lifecycle remains a controlled later-phase concern.

Timestamp columns are timezone-aware. Database triggers maintain updated timestamps even for direct SQL updates. Preferred dates are calendar dates rather than UTC instants. The foundation rejects invalid date formats/calendar values; Phase 6 now adds business-timezone future-date checks, idempotency and public submission protections. Scheduling availability is not promised.

Supabase identity UUIDs are verified by the provider and bound to its issuer in Phase 7. There is no fake `auth.users` table on native PostgreSQL. A conditional migration adds the real relationship where Auth and application data share a database; the selected separate native database uses verified provisioning and request-time checks instead. Runtime identities/roles remain read-only.

## Server and service boundary

- Every executable backend module imports `server-only`. The standalone schema is shared with migration tooling and contains no credentials.
- `getDatabase()` lazily opens one pooled runtime client; public demo builds do not require a database. Runtime URLs require `healthcare_app` (or the Supabase pooler form `healthcare_app.PROJECT_REF`).
- `getBackend()` verifies the singleton profile matches the configured deployment before returning internal services. A wrong or uninitialized client database fails closed. Injected database factories are used by tests and trusted tools.
- `catalogService` handles settings, active/published projections and service/page CRUD. `requestService` handles customer CRUD, atomic appointment-request creation and bounded inquiry reads/status changes.
- Zod validates unknown inputs and rejects unrecognized fields. Content blocks allow plain text and lists; they must be rendered with normal escaped React text, never raw HTML.
- Writes and their redacted audit events share a transaction. Appointment creation locks the active service while creating the customer/request; a failed audit rolls all writes back. Customer contacts are not treated as unique identities because families can share contact details.
- Service exceptions are mapped to structured safe codes/statuses. Driver details, query parameters, SQL, submitted values and secrets are never returned through `publicError`. PostgreSQL 18 `23001` and earlier FK `23503` both map to conflict.

These are **trusted internal foundation APIs**, not authorization mechanisms. Phase 6 adds protected public submission handlers; Phase 7 adds server-side Auth and permission guards for staff pages/APIs. Future management routes must authorize every service call. Internal foundation/provisioning events retain system/null actors; authentication session events use the verified staff mapping, never a client-supplied actor.

## Database privileges

Migrations run as the owner using a separate direct/session connection with max one client. The `healthcare_app` role has no superuser, database creation, role creation, inherited membership or RLS-bypass privileges. An existing unsafe role causes migration failure. The role is initially NOLOGIN; local provisioning sets its generated password outside migration files.

The security migration revokes PUBLIC and existing Supabase API-role access to the private schema/tables. RLS is enabled on all application tables. A policy permits the trusted server application role; no anonymous/authenticated browser policy exists. The role can read role/identity definitions but cannot modify them, perform DDL, read migration history or edit/delete audit records. It can only insert/read audits. It cannot delete appointments or inquiries. This protects the database boundary; it does not replace future HTTP/session authorization.

## Managed Supabase setup (prepared, deferred)

1. Provision a separate Supabase project for each client/environment; verify its PostgreSQL version, region and operational settings. Configure the matching major version in local `supabase/config.toml`.
2. Keep `healthcare` out of Data API exposed schemas. The checked-in local configuration exposes `public` only, disables automatic exposure of new tables, enables Auth with signup disabled and TOTP enabled, and leaves storage/realtime/email/edge features disabled.
3. Supply `DIRECT_URL` only to a migration job/CLI, using a direct connection or session pooler on port 5432. Run `npm.cmd run db:migrate`. Drizzle is the only migration authority; Supabase schema migration/automatic seed application is disabled to prevent two competing histories.
4. Provision `healthcare_app` with a distinct strong password via a secure administrative connection. Do not grant membership in elevated roles. Supply its connection as server-only `DATABASE_URL`. With the shared transaction pooler, use username `healthcare_app.PROJECT_REF`, the dashboard-provided pooler host and port 6543.
5. Run `npm.cmd run db:check`, staging migrations, role/negative-access tests and the client-specific suite against that environment before claiming managed verification. Do not use real patient data for these checks.

Postgres.js disables prepared statements and uses a small runtime pool (max 5), connect timeout and idle timeout. Remote connections require certificate verification; URL options cannot silently disable TLS. Local loopback connections use password authentication without TLS. Migration URLs on transaction-pooler port 6543 are rejected. No Supabase service-role key or SDK is required for server-side SQL access in this phase.

## Migration workflow and recovery

```powershell
npm.cmd run db:generate
npm.cmd run db:check-migrations
npm.cmd run db:local:migrate
# For an independently configured managed staging database:
npm.cmd run db:migrate
```

Commit the SQL, journal and snapshots together. `0000` defines the relational schema; `0001` defines privileges/RLS, timestamp triggers and role definitions. Phase 6 adds `0002` for submission fields/technical tables and `0003` for their RLS and restricted grants. Never edit an already-applied migration: the runner compares stored hashes to versioned files and rejects altered/unknown history. A session advisory lock serializes migration writers; the migration connection must remain max 1 in direct/session mode. Drizzle controls the SQL transaction itself.

Use additive, backward-compatible migrations, stage/test first, and back up before destructive changes. This phase never automatically resets a client database or invokes `drizzle-kit push`. Roll back application releases when the schema remains compatible; otherwise use a reviewed forward fix or a separately approved restore. Production backup/restore drills and deployment automation remain later-phase work.

## Repeatable verification

```powershell
npm.cmd run test:db
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:boundaries
npm.cmd run test:e2e
```

The database runner uses an independent cluster on loopback port 55432, creates four unique test databases, applies/replays all seven migrations, provisions a restricted runtime role, runs Node/Vitest tests and drops only the databases it created. Browser harnesses use one disposable application database each. The runner stops the test cluster if it started it and never resets the persistent development database. Test targets must be loopback, have a `healthcare_*test_*` name, and differ from known runtime/migration targets even when credentials differ. CI can supply `TEST_DATABASE_SERVER_URL` for a fresh dedicated local PostgreSQL service; the runner refuses a preexisting application role there rather than rotating someone else's credentials.

Tests exercise real queries/joins, CRUD, checks/FKs/uniqueness/enums, concurrent requests, transaction rollback through injected audit failure, seed race protection, wrong-client failure, audit minimization, prohibited DDL/role/record operations, Supabase API-role denial, safe errors, migration concurrency and history mismatch. API-role fixtures model role names/default table grants on plain PostgreSQL; they are not a running Supabase Data API test.

`test:boundaries` traverses client imports and scans built browser assets for configured backend secrets, including the private Auth provisioning key without loading it into the app environment. Results live under ignored `.db-results/`; secret values are not printed. Playwright verifies the disabled public preview, guarded staff routes, actual submission writes and real local Auth/permission behavior in separate suites. See SUBMISSIONS.md and AUTHENTICATION.md.

The scoped esbuild override removes the newly introduced moderate advisory in Drizzle Kit's deprecated loader dependency. Migration generation/checks are verified with the override. Existing 16 moderate ESLint/minimatch development-tool findings remain; production dependencies have no audit findings. No force downgrade is used.

## Primary references

- Installed Next.js data-security/environment guides in `node_modules/next/dist/docs/01-app/02-guides/`.
- [Drizzle PostgreSQL driver](https://orm.drizzle.team/docs/get-started-postgresql), [migrations](https://orm.drizzle.team/docs/migrations), [transactions](https://orm.drizzle.team/docs/transactions).
- [Supabase connections and pooler settings](https://supabase.com/docs/guides/database/connecting-to-postgres), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [CLI configuration](https://supabase.com/docs/guides/local-development/cli/config).
- [Supabase Docker/native runtime requirements](https://supabase.com/docs/guides/local-development/docker-and-native-runtimes): native local runtime does not support Windows.
- [PostgreSQL error codes](https://www.postgresql.org/docs/current/errcodes-appendix.html), [relational constraints](https://www.postgresql.org/docs/18/ddl-constraints.html).

Phase 8 additive migrations 0007–0008 bring the private schema to fifteen tables: versioned draft/published CMS state, bounded website media and append-only request activity. Assignment indexes and non-negative versions are enforced in the custom security migration. All tables have RLS; Supabase API roles retain no table privileges. Management transactions use verified staff permissions and per-record assignment scopes. Runtime cannot edit staff mappings, rewrite history or replace published image bytes. See CONTENT_MANAGEMENT.md.

Migration SQL is pinned to LF in `.gitattributes`: Drizzle hashes raw file bytes, so Windows checkout conversion must not change an applied migration checksum. Existing SQL content remains immutable.
