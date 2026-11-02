# Running verification

Use Node 24 LTS and `npm ci`. On PowerShell, use `npm.cmd` if execution policy blocks npm.

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run build
npm run test:e2e
```

Vitest uses jsdom and React Testing Library. `npm run test:watch` is available for development. Playwright launches the production build on port 3100; stop an unrelated service on that port before running. `npm run test:e2e:foundation` runs only the Phase 1 smoke checks. `npm run test:routes` remains the dependency-free HTTP check (requires a separately running server).

Browser failures retain screenshots and traces in `test-results`; the HTML report is in `playwright-report`. These generated files are ignored by Git and uploaded as CI artifacts. The workflow is configured locally; a local pass does not claim a successful hosted GitHub Actions run. Browser tests contain fictional details only.

Phase 6 adds `npm run test:db` (real foundation/submission integration) and `npm run test:submissions` (active form/browser/API integration). Run them sequentially because each provisions its own restricted role on the same dedicated test cluster. Both use disposable databases; normal public E2E/profile runs explicitly keep submissions disabled. Build before browser tests. Active form artifacts live in `.db-results/browser-results` and `.db-results/browser-report`. See [SUBMISSIONS.md](../architecture/SUBMISSIONS.md) for the explicitly opt-in QA clock adjustment needed only on networks replaying future-dated Cloudflare challenge responses. Production/live-key behavior is not covered by local test keys.
