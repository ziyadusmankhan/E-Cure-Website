# Website design system

The current E-Cure website uses the supplied official blue/green logo, navy headings, white/off-white surfaces and green actions, with Manrope headings and Inter body text. The earlier black/green design reports are historical. The client palette is configured in `src/config/client-presentation.ts` and applied consistently by the root layout and WebsiteProvider; CMS primary/secondary color overrides retain their existing precedence. Shared base tokens live in `src/styles/tokens.css`; E-Cure foundation, public and staff styles live in `src/styles/ecure.css`, `ecure-public.css` and `ecure-admin.css`. Global layout and supported profile styles remain in `src/app/globals.css`.

| Purpose | E-Cure default |
| --- | --- |
| Headings/selected dark surfaces | Navy `#0B325F` |
| Links, navigation selection and focus | Blue `#075A9E` |
| Primary actions | Green `#247D29` |
| Brand accents | Green `#329B32`, secondary blue `#1376B9` |
| Backgrounds | White, off-white `#F4F8FB` |
| Body/muted text | `#34465A`, `#526579` |
| Decorative borders / control borders | `#DFE7ED` / `#75899D` |

The darker action green supports white labels; the brighter brand accent is reserved for suitable accents rather than small white text. Client-scoped selectors prevent E-Cure presentation from replacing alternate-profile typography/colors. Existing semantic status/error colors remain independent of marketing branding.

`src/config/branding.ts` owns the official asset paths and default-only photo resolution. The supplied JPEG is preserved intact and framed with CSS to remove surrounding white margins without stretching or redrawing the artwork. The favicon is derived from that artwork. Custom CMS uploads remain authoritative. A saved CMS brand can override the source business name/logo; edit the CMS content rather than hardcoding a replacement into shared components. See the [5 November branding correction](../deployment/ORACLE_BLUE_GREEN_UPDATE_2026-11-05.md).

The typed theme catalog in `src/config/themes.ts` retains the supported Clinical Blue, Soft Teal and Warm Neutral presets for alternate profiles. Unit tests check readable text/action contrast and theme validation. The default E-Cure profile applies its approved brand settings through the existing profile/provider architecture.

Reusable production components include Button, FAQ, service cards, public navigation, Brand and ServicesMenu. The actual staff dashboard uses StaffFrame, RecordTable, the operations views and CMS editor. Their authentication, authorization and data access remain in the existing server layers.

The opt-in `/design-system` review route, fictional AdminShell and demo-only Field, AccessibleDialog, StatusBadge and DataTable were removed during hosting cleanup. The route now returns 404 regardless of the former environment flag. Historical phase reports describe the earlier review milestone; they are not deployment instructions.

Tests retain theme contrast, FAQ keyboard interaction, actual public pages, responsive layouts, reduced motion and operational admin flows. Browser/accessibility checks describe automated coverage only and do not constitute physical-device testing or accessibility certification. See `docs/deployment/CLEANUP_REPORT.md` for checks executed after cleanup.
