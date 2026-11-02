# Environment contract

The current demo runs without credentials. `NEXT_PUBLIC_SITE_URL` is optional, must be an absolute HTTP(S) URL if supplied, and becomes public in the browser bundle. Leave it unset for local development. Future credentials must never use a `NEXT_PUBLIC_` prefix.

Phase 5 introduces server-only `DATABASE_URL` (restricted runtime) and `DIRECT_URL` (migration job only). Auth, mail, storage and Turnstile settings remain later-phase work. Each customer has independent deployments, credentials and databases. Keep runtime, migration, staging and production permissions separate. Do not activate public submissions yet.

`.env.example` documents only supported variables; `.env*` files are ignored except that example. CI Phase 1 requires no application secrets. The first font build downloads fonts; allow Google Fonts access during build. Production visitors receive self-hosted font files.

Local database setup uses `npm.cmd run db:local:start`, creates a SCRAM-protected cluster on loopback port 55433, and writes only the runtime credential to ignored `.env.local` if absent. Owner credentials and local logs remain under ignored `.local/postgres-dev/`. Tests use their own cluster on port 55432 and unique databases. `TEST_DATABASE_SERVER_URL` is exclusively for a fresh dedicated loopback CI test server. `PG_BIN` optionally selects installed PostgreSQL binaries. `ALLOW_DEMO_SEED=true` explicitly permits non-production demo fixtures. See `BACKEND.md` for permissions, Supabase setup, migrations and verification.

The user chose local PostgreSQL for Phase 5. Supabase CLI/configuration are prepared, with managed/local-stack verification deferred after Docker's engine failed. Do not expose `healthcare` through Supabase Data API or prefix database/service secrets with `NEXT_PUBLIC_`.

Phase 4 adds `NEXT_PUBLIC_SITE_PROFILE` (default/general-clinic/home-care/physiotherapy-center). This public identifier must be fixed before build so server-rendered pages and client-side navigation/forms agree. Restart dev or rebuild to change it, and preserve it at production startup. Use independent deployment environments rather than per-request switching. `SITE_THEME` is an optional palette override; unset means the profile's preset. `ENABLE_DESIGN_SYSTEM` remains the opt-in developer review route. All public profile contents may be bundled for the browser; keep secrets and customer records out of them.
