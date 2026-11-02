# Phase 2 design foundation

Preserve the approved Lora/Source Sans pairing, 10px buttons, photo effects and WhatsApp control. Tokens live in `src/styles/tokens.css`; new component styles live in `src/styles/components.css`. Existing public layout styles remain in `globals.css`.

Three controlled presets are provided: Clinical Blue, Soft Teal and Warm Neutral. Set `SITE_THEME` before building to choose a deployment palette. The typed catalog in `src/config/themes.ts` matches the CSS data-theme scopes. Unit tests check text/action contrast on white, canvas and tint surfaces; browser axe checks validate rendered samples. Semantic status colors remain independent from brand settings. Full client content configuration belongs to Phase 4.

Reusable components: existing Button, FAQ, service cards, public navigation; new Field, AccessibleDialog, StatusBadge, DataTable and AdminShell. Field consumers connect input aria-describedby to its hint/error IDs and set aria-invalid. Tables preserve captions and column headers while presenting stacked rows on phones. Dialogs manage focus and Escape. AdminShell is only a visual component, with no data access or permissions implementation.

## Opt-in review route

Set ENABLE_DESIGN_SYSTEM=true to access `/design-system`. With the flag absent or false the route returns 404. It is always noindex, absent from the sitemap and omitted from public navigation. Leave disabled on customer deployments. The fixture uses only fictional records and does not provide operational admin access.

The review page exercises themes, buttons, errors, dialogs, service cards, FAQs, statuses, tables and workspace navigation. No authentication, CRUD, database, or real submissions are added in Phase 2.

## Verification scope

Unit/component tests cover contrast, theme validation, dialog interactions, empty tables, textual status and FAQ keyboard use. Browser tests cover all seven widths, each preset, axe checks, errors, keyboard focus, reduced motion and public-flow regressions. Screenshots are produced for visual review. These checks do not constitute WCAG certification, physical-device testing, cross-browser certification or a Lighthouse audit.
