# Environment contract

The current demo runs without credentials. `NEXT_PUBLIC_SITE_URL` is optional, must be an absolute HTTP(S) URL if supplied, and becomes public in the browser bundle. Leave it unset for local development. Future credentials must never use a `NEXT_PUBLIC_` prefix.

Later phases will introduce server-only database, auth, mail, storage and Turnstile settings when their integrations are implemented. Do not add placeholder secrets or enable production submissions now. Each future customer will have independent deployments, credentials and databases. Keep runtime, migration, staging and production permissions separate.

`.env.example` documents only supported variables; `.env*` files are ignored except that example. CI Phase 1 requires no application secrets. The first font build downloads fonts; allow Google Fonts access during build. Production visitors receive self-hosted font files.

Phase 4 adds `NEXT_PUBLIC_SITE_PROFILE` (default/general-clinic/home-care/physiotherapy-center). This public identifier must be fixed before build so server-rendered pages and client-side navigation/forms agree. Restart dev or rebuild to change it, and preserve it at production startup. Use independent deployment environments rather than per-request switching. `SITE_THEME` is an optional palette override; unset means the profile's preset. `ENABLE_DESIGN_SYSTEM` remains the opt-in developer review route. All public profile contents may be bundled for the browser; keep secrets and customer records out of them.
