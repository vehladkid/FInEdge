# Design of Tests

## 1. Strategy

Testing is organised as a pyramid, and each layer targets a different kind of defect:

| Layer | Tooling | Target | Count (v1.0.0) |
|---|---|---|---|
| Unit — backend | Vitest | Pure business logic: validators, dates, password policy, money rounding, budget/analytics calculations, insight rules, AI client parsing, error handler | 135 tests, 9 files |
| Unit / component — frontend | Vitest, jsdom, React Testing Library, user-event | `formatCurrency`, API client, session storage, auth flow & protected route, transaction form, dashboard and budget pages | 39 tests, 5 files |
| **Integration** | Vitest + Supertest, real PostgreSQL (`finedge_test`) | The real Express app end to end through routes, validation, services, SQL and the database | 75 tests, 5 files |
| **Regression / end-to-end** | Playwright (Chromium) | Real browser → real API → real PostgreSQL (`finedge_e2e`) at 1440×900, 1280×800 and 390×844 | 40 tests × 3 viewports = 120 |
| **Mutation** | StrykerJS (Vitest runner) | The quality of the unit tests on the business-logic modules | 547 mutants, score 96.53 % |

## 2. Principles

- **Test behaviour, not implementation.** Unit tests assert inputs and outputs (and, for the API, status codes, bodies and database effects); they do not inspect private state.
- **Real dependencies where the risk is.** Integration tests use a real PostgreSQL database — SQL, constraints, transactions and aggregation are exactly where mocks would hide bugs. Only external services are replaced: the AI provider is injected (`createApp({ ai })`) and its `fetch` is a parameter.
- **Isolation.** The integration setup refuses to run unless the database name ends with `_test` and truncates tables before each test; each E2E test registers its own user so tests are independent and can run in parallel.
- **Boundaries first.** Cases are chosen at the edge of every rule: a password of 7/8/72/73 characters, a budget exactly at 80 % / 100 % / one cent over, the first and last day of a budget period, a date range with `from == to`, amounts of 0.01 and 9 999 999 999.99, February 29/30, empty lists, zero income, zero expenses.
- **Security cases are first-class.** Missing/invalid/expired/forged tokens, wrong password vs unknown e-mail (identical responses), duplicate e-mail under concurrent requests, and every cross-user access path (read, edit, delete, use another user's category, budget spend leakage).
- **No fabricated baselines.** The regression suite asserts concrete behaviour (text, totals, URLs, element counts, absence of overflow) rather than comparing against auto-generated screenshots, so a pass means the behaviour is right, not merely unchanged.

## 3. Test design by feature

### Authentication (integration, unit, E2E)
Equivalence classes: valid registration; each invalid field (name, e-mail, password rule); duplicate e-mail (any case; simultaneous); valid login; wrong password; unknown e-mail; no token; wrong scheme; empty bearer; garbage token; expired token; token signed with another secret; token for a deleted user. UI: success redirect (to the originally requested page), error messages, button disabled while submitting, token cleared when rejected, session expiry mid-use.

### Transactions
CRUD happy paths; each validation rule (amount ≤ 0, text amount, bad type, impossible date, description > 200); unknown or other-user category; category/type mismatch; filters alone and combined; inclusive date bounds; pagination first/last/beyond-last; isolation between users (get/update/delete/create-with-foreign-category).

### Categories
List and type filter (including an ignored invalid filter); create with trimming; duplicates (same type → 409, other type → allowed); rename and rename-collision; delete unused, blocked when used (singular/plural message), allowed again after the transactions go; budgets removed with their category; isolation.

### Budgets
Creation derives the end date; duplicates and collisions on update; only expense categories; `spent` counts only this category, only expenses, only this user, only inside the inclusive period; `ok` → `warning` at exactly 80 % → exactly-at-budget (100 %, *not* exceeded) → one cent over (*exceeded*); edits and deletes of transactions change the budget immediately. Pure `budgetStatus` and `endOfPeriod` (week/month/year, month-end clamping, leap years) are unit- and mutation-tested.

### Reports and insights
Dashboard on an empty account (all zeros, no invented data) and with data (balance across months, shares, active budgets only); analytics zero-fill, window exclusion, daily series, range validation; insights: empty month, each rule at and just below its threshold, rule ordering, tie-breaking, rule-based fallback, AI success, AI failure/empty/invalid answers, and that nothing resembling an e-mail or password is sent to the provider.

### Responsive and resilience (E2E)
Every page at three viewports has a visible heading, finished loading and `scrollWidth ≤ clientWidth`; navigation works with and without the mobile menu; charts render (`svg`, pie sectors, bars); dialogs open and close; every page loads with **no console errors, page errors, failed or ≥ 400 requests**; the API being unreachable produces a readable error and a working Retry.

## 4. Mutation testing design
Mutation testing is applied to the modules that contain decisions and arithmetic and have no I/O: `utils/dates`, `utils/password`, `utils/money`, `validators`, `services/budgetCalc`, `analyticsCalc`, `insightRules`, `aiClient`, `middleware/errorHandler`, `errors`. Animation-heavy React components and SQL repositories are deliberately not mutated; they are covered by the browser and integration tests. The build fails below 80 %. Results and the rationale for each surviving mutant are in `TESTING.md`.

## 5. Entry/exit criteria
A change is releasable when lint is clean, all unit, integration and regression tests pass, the mutation score is ≥ 80 %, the production build and both Docker images build, and CI is green.
