# White-label foundation

One master application builds one independent website per deployment. There is no request-based tenant switching. Current database-backed CMS, submissions and staff authentication use the existing deployment identity and isolated environment/services; business profile files contain public content only. The original Phase 4 foundation has since been extended by the platform backend and client redesign stages.

## Selection and defaults

Set `NEXT_PUBLIC_SITE_PROFILE` before starting dev or building production. Supported identifiers:

| Identifier | Branding | Theme | Enabled services |
| --- | --- | --- | --- |
| default | E-Cure Home Health Services | Configurable E-Cure blue/green presentation on the existing theme contract | Original six home health categories |
| general-clinic | Willow Clinic — Demo | Clinical Blue | General consultation, follow-up consultation, laboratory services |
| home-care | Harbor Home Care — Demo | Soft Teal | Nursing, caretaker support, physiotherapy, online consultation, laboratory services |
| physiotherapy-center | Stride Physiotherapy — Demo | Warm Neutral | Physiotherapy, mobility assessment, rehabilitation support |

The three alternate businesses are fictional examples, with `.example` contact domains and explicit demonstration labeling. They do not represent real professionals, operational contacts or available services. All remain noindex demonstrations. E-Cure keeps the original `default` deployment ID to preserve database/CMS associations; its approved client branding is applied by `withEcureBranding` without replacing the master platform's other profiles.

```powershell
$env:NEXT_PUBLIC_SITE_PROFILE = "general-clinic"
npm.cmd run dev
```

Stop dev with Ctrl+C before switching. Restart dev after changing the profile. For production, set the same identifier for both `npm.cmd run build` and `npm.cmd start`. The public selector is inlined into client bundles at build time: changing it only at server startup is unsupported. Build each client separately, with its own domain/environment and future isolated database. Do not run builds concurrently in this checkout.

`SITE_THEME` is an optional build-time override. Leave it unset to use the profile's selected theme. `NEXT_PUBLIC_SITE_URL` optionally overrides the profile canonical base. Unknown profile identifiers fail explicitly rather than serving another client's identity. URLs must use HTTP(S); logo and service artwork must use local paths. These checks validate configuration, not professional credentials or legal compliance.

## Editing configuration

- `src/config/profiles.ts`: typed business profiles, identity, business type, logo/brand line, contacts/social links, theme, service activation and order, navigation, media, benefit/process copy, FAQ groups, visibility and SEO defaults.
- `src/config/branding.ts` and `src/config/client-presentation.ts`: E-Cure-specific source identity/assets and presentation tokens. The root layout/provider applies the preset only for that presentation. CMS color/logo overrides retain precedence; other client profiles keep their existing styles.
- `src/config/content/default-copy.ts`: typed public text fields shared by default. Keys identify the page/component and original text. Profiles override only the fields that differ. Keep mandatory demo acknowledgments truthful; real submissions belong to later phases.
- `src/data/service-catalog.ts`: original service descriptions. `src/config/service-templates.ts`: additional fictional clinic/physiotherapy content. A profile may also replace the entire typed service collection; UI components do not assume particular slugs or six services.
- `src/config/profile-utils.ts`: active catalog, filtered related links, visible navigation, public paths and configuration validation.
- Header/footer read the selected navigation through `visibleLinks` in `src/config/profile-utils.ts`; the unused navigation adapter was removed during hosting cleanup.
- `src/config/metadata.ts`: selected per-page metadata. Service metadata comes from that service's configured title/description.

`src/config/site.ts` resolves the selected source profile; the existing CMS public resolver and WebsiteProvider supply the authorized published/draft snapshot to templates and forms. Profile utilities preserve configured catalogs and visibility. Client-specific CSS applies the approved presentation without changing backend eligibility, access checks or request processing.

## Visibility and consistency

Disabled services are removed from cards, menus, related links, booking options, booking validation, generated route parameters and public URL lists. Direct visits to disabled service routes return 404. Sitemap remains empty for demo configurations; if indexing is explicitly enabled for an appropriate non-fictional deployment later, it uses only the active public paths.

Homepage section flags control About, Services, benefits, process, testimonials, questions, contact and CTA. Anchor navigation filters against those flags. Independent feature flags govern WhatsApp, inquiry form, appointment UI, service FAQs and related services. Existing testimonials remain hidden unless both their flag and section are enabled; no approved review data is invented.

The fixtures demonstrate variation: the clinic omits the home-care benefits section and WhatsApp; the home-care agency omits the homepage About preview; physiotherapy disables the demo inquiry form. Their complete About and Contact routes still provide information. Hidden homepage sections do not imply those standalone pages are unpublished.

## Verification and updates

`npm.cmd run test:profiles` builds each fictional profile independently and runs its own production Chromium tests on port 3200. It checks branding, artwork, selected theme, responsive layouts, navigation, disabled-service 404s, booking prefill/validation, feature visibility, noindex behavior and scoped accessibility. Each server stops before the next build. The script always attempts to restore a default build, including after failure. Results and screenshots are in ignored `.profile-results/`. Do not run a dev server or another build during this matrix.

Run the normal default regression suite after the matrix. Unit tests validate all configurations, local assets, mandatory copy, unique slugs, safe URLs, navigation filtering and disabled-service intake rejection. Use fictional details only.

For client upgrades, pin a reviewed master Git release and lockfile, keep approved public profile overrides in version control, apply the next release in a staging checkout, resolve configuration/type changes there, rebuild with the client's identifier, run its matrix/regression checks, obtain content/operational signoff, and then deploy. Keep the prior artifact/release for rollback. Keep production credentials outside profile files and follow the existing [backend procedures](BACKEND.md) for the selected environment.
