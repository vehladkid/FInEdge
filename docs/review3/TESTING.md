# Testing — strategy, commands and results (v1.0.0)

All numbers below come from the unedited logs in `evidence/logs/` (produced by `tools/run-evidence.sh` from clean `npm ci` installs). Design rationale is in `design-of-tests.md`.

## Commands

| Command | Directory | Result |
|---|---|---|
| `npm run lint` | backend, frontend | clean (0 errors, 0 warnings) |
| `npm run test:unit` | backend | **135 passed** (9 files) |
| `npm run test:unit` | frontend | **39 passed** (5 files) |
| `npm run test:integration` | backend | **75 passed** (5 files, real PostgreSQL) |
| `npm run test:mutation` | backend | **96.53 %** (threshold 80 %) |
| `npm run test:regression` | frontend | **120 passed** (40 tests × 3 viewports) |
| `npm run build` | frontend | success (see warnings) |
| `docker build` backend / frontend | repo root | both images build |

`npm run test:e2e` runs the same Playwright suite at 1440×900 only; `test:regression` runs all three viewports.

## Integration testing
`backend/tests/integration/*.test.js` drive the real Express app with Supertest against PostgreSQL. `setup.js` migrates the schema and refuses to run on a database whose name does not end in `_test`. Files: `auth`, `transactions`, `categories`, `budgets`, `reports` (dashboard, analytics, insights). Covered: every endpoint's success path; validation failures; 401/404/409 responses; cross-user isolation; database effects (hashed password, cascades, restrict); budget arithmetic against real rows; aggregation correctness; AI provider injected as success / failure / empty with a check that no e-mail or password-like text is sent; concurrent duplicate registration.

## Regression testing
The Playwright suite (`frontend/tests/e2e`) runs the **real** React app, API and PostgreSQL (`finedge_e2e`) and is the regression net for user journeys:

| Spec | Journeys |
|---|---|
| `auth.spec.js` | register → empty dashboard → logout; login returns to requested page; wrong password; server validation; duplicate e-mail; all protected routes redirect; invalid stored token; session expiring mid-use |
| `transactions.spec.js` | add expense (appears in list and dashboard); add income; client validation; edit and delete; filters; pagination; API-unreachable error + Retry; navigation |
| `budgets.spec.js` | empty → create; spent/remaining/percent from real transactions and after adding one through the UI; edit/delete; duplicate budget; validation; dashboard budget status and insight |
| `categories-analytics.spec.js` | create/rename/use/delete-blocked/delete category; duplicate; analytics empty state, totals and charts, range control; rule-based insights |
| `layout.spec.js` | six authenticated pages + three public pages: heading visible, loading finished, **no horizontal overflow**; navigation (collapsible on mobile); charts; dialogs; add-transaction usable |
| `health.spec.js` | every page loads with no console errors, page errors or failed/≥400 requests; landing links and backend status |

Viewports: **Desktop 1440×900, Laptop 1280×800, Mobile 390×844** (touch). The strategy deliberately avoids pixel-diff baselines: a baseline generated from the same build proves nothing, so assertions check behaviour (text, numbers, URLs, element counts, overflow). Screenshots of the UI (`screenshots/app/`) are captured separately for the documents.

Real defects found by this suite during development and fixed: a table's screen-reader-only cell caused 16 px of horizontal scroll on mobile; currency rendered negative values as `$-42.10`; a stale in-memory token survived `localStorage` being cleared.

## Mutation testing
- **Tool:** StrykerJS 10, Vitest runner, `coverageAnalysis: perTest` (`backend/stryker.config.json`). The runner requires Vitest ≤ 3.x here (with Vitest 5 every mutant survived, which is how the incompatibility was detected), so Vitest is pinned to 3.
- **Targets (10 files):** `utils/dates`, `utils/password`, `utils/money`, `validators/index`, `services/budgetCalc`, `analyticsCalc`, `insightRules`, `aiClient`, `middleware/errorHandler`, `errors/index`. Nothing was excluded to improve the score; UI components and SQL repositories are covered by the E2E and integration layers instead.
- **Result:** 547 mutants — **527 killed, 1 timeout (detected), 19 survived**; score **96.53 %**; per-file table and every survivor in `evidence/mutation-summary.md`.
- **Process:** first run 17.85 % exposed the Vitest 5 incompatibility; after pinning, 94.41 % → tests were added for each real gap (error messages, ties, severities, trimming, prompt shape, boundary dates) → redundant code was removed where a guard was dead (`isValidIsoDate` now round-trips through `Date`) → 96.53 %.

### Surviving mutants and why they were not "fixed"
| Mutants | Reason |
|---|---|
| `aiClient.js:31` (3), `:38` (1) | Provider-body shape variants all end in the same observable result (a thrown error → rule-based fallback); the severity default equals the literal that was blanked. Equivalent. |
| `insightRules.js:54` (2), `:66` (2), `:104` (1) | Guards that are unreachable with consistent data (categories exist only when expenses > 0; at equality the growth is 0 %, below the 20 % threshold; income 0 with no insight cannot occur once savings rules fire). Equivalent. |
| `dates.js:4` (2), `:7` (3) | Defence-in-depth guards (anchors, `typeof`) made redundant by the final round-trip check `toIso(date) === value`, which rejects those inputs anyway. |
| `validators:11` (1), `:25` (1), `:39` (1) | `join(".")` only matters for nested field paths (none exist); `<` vs `<=` at a 1e-6 floating-point epsilon is unreachable; zod's issue `code` is metadata. |
| `validators:48`, `:75` (2) | Replacing a schema with `{}` makes the module throw on import (`.pick`/`.omit` of a missing key), so the test files fail to load — detected by the suite, but Stryker's runner reports a load failure as *survived*. |

## Coverage
| Scope | Statements | Branches | Functions |
|---|---:|---:|---:|
| Backend, unit tests (logic modules, error handler, AI client) | 99.22 % | 99.22 % | 96.55 % |
| Backend, integration tests (all `src/`, excluding `server.js` and `migrate.js`) | 90.94 % | 90.28 % | 99.08 % |
| Frontend unit tests (components, contexts, hooks, services, utils) | 95.78 % | 87.5 % | 49.01 % |

Not covered by unit coverage, by design: `frontend/src/pages/*` and the charts (covered by Playwright — Recharts needs real layout, so unit tests stub it), `services/finance.js` (one-line wrappers, mocked in unit tests and exercised by every E2E test — which is why function coverage is 49 %), `server.js` (process start), `db/migrate.js` (run by every integration and E2E start-up and by Docker). Backend integration coverage gaps are the AI provider's network call (unit-tested with an injected `fetch`) and the production branch of the error handler (unit-tested).

## Known warnings
- `vite build` warns that the JS bundle is 629 kB (> 500 kB) because Recharts is bundled in one chunk. Not an error; code-splitting is a possible future improvement.
- `npm audit` reports advisories in transitive development dependencies of the frontend toolchain; none are in the runtime path and they were not force-upgraded to avoid breaking changes.
