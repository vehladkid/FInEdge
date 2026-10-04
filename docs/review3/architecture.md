# System Architecture and Design

## 1. Overview

FinEdge is a **layered monolith** deployed as three containers (frontend, backend, PostgreSQL) by `docker-compose.yml`. The brief for the project explicitly excludes microservices and queues; a single REST API over one relational database is sufficient for the data volume and keeps the system easy to run and test.

```
 USER ─▶ React/Vite SPA ──HTTP JSON (Bearer JWT)──▶ Express API ──pg──▶ PostgreSQL
                                                      │
                        routes → middleware → controllers → services → repositories
                                                      └─ optional ─▶ AI provider
```

(Diagrams: `diagrams/uml-component.png`, `dfd-level-0.png`, `dfd-level-1.png`.)

## 2. Frontend (React 18, Vite, Tailwind 3, Recharts, react-router 7)

| Concern | Where |
|---|---|
| Pages | `src/pages/` — Landing, Login, Register, Dashboard, Transactions, AddTransaction, Categories, Budget, Analytics |
| Layout & primitives | `layouts/PageShell`, `components/NavBar`, `components/ui/Card`, `ui/States` (loading/error/empty, shared field styles) |
| Session | `contexts/AuthContext.jsx` (user, status, login/register/logout) and `components/ProtectedRoute.jsx`; the JWT lives in `localStorage` through `services/session.js`, which falls back to memory if storage is blocked |
| Data access | `services/api.js` is the only module that calls `fetch`: base URL, bearer header, query params, uniform `ApiError`, and a `401` handler that clears the token and signs the user out. `services/finance.js` exposes one function per endpoint. |
| Async state | `hooks/useAsync.js` returns `{data, error, loading, reload}` |
| Charts | Recharts with shared tokens in `theme.js` (the same hex values feed Tailwind and the chart props) |
| Formatting | `utils/format.js` (currency, sign before symbol), `utils/dates.js` |

The landing page's preview panel is a fixed, labelled *sample*; every authenticated screen shows only API data.

## 3. Backend (Express 4, Node 22)

```
src/
  app.js            createApp({ai}) — middleware + routes, importable without opening a port
  server.js         process entry point
  config/           the only reader of process.env
  routes/           api.js (auth guard applied after the public auth routes), health.js
  middleware/       auth (JWT), validate (zod -> req.valid), errorHandler
  controllers/      HTTP only: read req.valid, call a service, shape the response
  services/         business rules (auth, category, transaction, budget, analytics, insight)
                    pure logic: budgetCalc, analyticsCalc, insightRules   (no I/O)
                    aiClient: optional provider call
  repositories/     all SQL (parameterised); one file per table/report
  validators/       zod schemas + parse()
  db/               pool.js (type parsers), migrate.js, migrations/
  utils/            dates, password policy, money rounding, clock
  errors/           AppError and factories
```

**Authentication.** `register` checks for an existing e-mail, hashes with bcrypt, inserts the user and the nine default categories in one transaction, and returns a JWT (`sub` = user id). `login` compares the hash and answers identically for unknown e-mail and wrong password. `requireAuth` verifies the bearer token and sets `req.userId`; services never trust an id from the client.

**Request flow.** `route → requireAuth → validate(schema) → controller → service → repository → PostgreSQL`; any thrown `AppError` (or unexpected error) reaches `errorHandler`, which emits `{success:false, error:{code,message,details?}}` and hides internals in production.

**Budgets.** `repositories/budgets.js` selects each budget together with `spent`, a correlated subquery summing the user's expense transactions in that category between `start_date` and `end_date`. `services/budgetCalc.budgetStatus` turns `(amount, spent)` into `remaining`, `percentUsed`, `exceeded` and `status`. The same function feeds the budget list, the dashboard and the insights.

**Analytics.** `analyticsService` issues aggregate queries (totals by type, monthly totals, expenses by category, daily expenses) and `analyticsCalc` zero-fills months and computes shares; no endpoint ships raw transaction lists for charting.

**Insights.** `insightService` gathers aggregates for this and the previous month and calls the provider if `AI_API_KEY` is set. Any failure, empty answer or missing key falls through to `insightRules.generateInsights`, a pure function. Only aggregated figures — no names, e-mails or individual rows — are ever sent to the provider.

## 4. Database

PostgreSQL 16; schema in `backend/src/db/migrations/001_init.sql` (see ERD). Design choices: `NUMERIC(12,2)` for money with `CHECK (amount > 0)`; `ON DELETE RESTRICT` from transactions to categories (a label cannot vanish under a record) and `CASCADE` to budgets; unique `lower(email)`; unique `(user_id, name, type)` categories and `(user_id, category_id, period, start_date)` budgets; indexes on `(user_id, transaction_date DESC)` and `category_id`. The `pg` type parsers return numbers for `NUMERIC` and plain strings for `DATE`, so no timezone shifting occurs. **No other datastore (cache, queue, search) is used.**

## 5. Deployment and configuration

- `docker-compose.yml`: `postgres` (16, health-checked), `backend` (runs `node src/db/migrate.js && node src/server.js`), `frontend` (Vite dev server on 5173).
- Configuration is by environment variables (README). Secrets are never committed; `docker-compose.yml` contains only a labelled local-development JWT secret default.
- No cloud deployment (e.g. Vercel) is configured in this repository. For production, serve `frontend/dist` from a static host or reverse proxy and set `JWT_SECRET`, `CORS_ORIGIN`, `VITE_API_URL`.
- CI (`.github/workflows/ci.yml`): backend (lint, unit, integration with a PostgreSQL service, mutation), frontend (lint, unit, build), end-to-end (Playwright, PostgreSQL service) and Docker image builds.

## 6. Quality attributes and how the design delivers them

| Attribute | Mechanism |
|---|---|
| Security | bcrypt, JWT, per-user scoping in every query, parameterised SQL, validation at the edge, body size limit, no stack traces in production |
| Consistency | budget/dashboard/insights share one calculation path; totals computed from rows, never stored |
| Testability | `createApp()` has no side effects; pure modules; injectable AI provider; isolated `*_test` database guard |
| Resilience | optional AI never blocks insights; storage-blocked sessions fall back to memory; API errors become readable UI messages |
