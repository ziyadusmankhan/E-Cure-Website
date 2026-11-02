# Foundation audit and implementation plan

The existing application is a single Next.js 16.4.2 App Router package with React 19, strict TypeScript, Tailwind 4, Radix UI, React Hook Form and Zod. Its 12 public routes, six typed service descriptions, central business configuration, mobile navigation, FAQ, and demo forms are reusable. No runtime database, authentication, or notification service exists.

Phase 1 adds executable regression checks and CI rather than moving working routes. `src/types` holds shared contracts, `src/config` holds configuration, `src/data` holds current demonstration content, and `src/components` separates forms, shared UI and layout. New feature and database folders will be introduced only when those phases require actual implementations.

Plan: preserve public behavior; type the existing business config; add Vitest/RTL validation and interaction tests; add production Playwright smoke tests; document environments and gates; run lint, types, unit tests, production build and browser smoke checks. Proceed to Phase 2 only after successful results, as authorized by the user's 2 November message.

Known gaps for later phases: catalog content is source-driven, forms do not submit, there is no admin authorization or database, legal copy is provisional, production business details are unconfirmed, and demo routes are deliberately noindex. None of these is activated by Phase 1.
