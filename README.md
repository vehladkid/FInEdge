# FinEdge

A personal finance web app: record income and expenses, organise them into categories, set budgets, and see where your money goes through a dashboard, analytics charts and plain-language insights.

- **Repository:** https://github.com/vehladkid/FInEdge
- **Stack:** React 18 · Vite · Tailwind · Recharts → Express 4 (Node 22) → PostgreSQL 16, all runnable with Docker.

## Problem

Spreadsheets are tedious and many finance apps are bloated or paid. FinEdge is a small, self-hostable tracker that stores a user's transactions securely, keeps budgets honest by computing spend from the real transactions, and explains spending patterns in a few sentences. See [`docs/review3/problem-statement.md`](docs/review3/problem-statement.md).

## Features

| Area | What it does |
|---|---|
| Accounts | Register / log in with bcrypt-hashed passwords and 2-hour JWT sessions; protected routes in the UI and API. |
| Transactions | Create, edit, delete; filter by type, category and date range; paginated list. |
| Categories | 9 defaults per new user; create, rename, delete (blocked while transactions use the category). |
| Budgets | Weekly / monthly / yearly limits per expense category; spent, remaining, % used and `ok` / `warning` / `exceeded` status are calculated by the backend from real transactions. |
| Dashboard | Balance, month income/expenses, spending by category, recent transactions, active budgets, insights — with loading, error and empty states. |
| Analytics | Income vs expenses per month, category breakdown, daily spending, savings rate; 3/6/12-month ranges. |
| Insights | Rule-based engine (budget exceeded / near limit, category spikes, dominant category, month-over-month growth, overspending, savings rate). If `AI_API_KEY` is set, an AI model writes the insights from *aggregated* figures and the rule engine is the automatic fallback. |

## Architecture

```
Browser (React SPA) ──HTTPS JSON + Bearer JWT──▶ Express API ──pg──▶ PostgreSQL
                                                   │
                         routes → middleware → controllers → services → repositories
                                                   └── optional ──▶ AI provider (aggregated data only)
```

- `backend/src/routes` → `controllers` (HTTP only) → `services` (rules) → `repositories` (SQL). Pure logic (`budgetCalc`, `analyticsCalc`, `insightRules`, `utils/dates`, `utils/password`) has no I/O so it is unit- and mutation-tested.
- `backend/src/db/migrations/*.sql` is the single source of truth for the schema; `npm run migrate` applies it (the Docker backend does this on start).
- `frontend/src/services/api.js` owns every HTTP call; `contexts/AuthContext.jsx` + `components/ProtectedRoute.jsx` own the session.

Full documentation, diagrams (DFD, ERD, UML) and the SRS are in [`docs/review3/`](docs/review3/).

## Prerequisites

Node.js 22, Docker (for PostgreSQL, or the full stack), Git.

## Quick start (Docker — everything)

```bash
git clone https://github.com/vehladkid/FInEdge.git
cd FInEdge
docker compose up --build
```

- App: http://localhost:5173 · API: http://localhost:5000 · PostgreSQL: localhost:5433 (`finedge` / `finedge`)
- Migrations run automatically when the backend container starts.
- `docker compose down` stops it; add `-v` to also delete the database volume.

## Local development (without Docker for the apps)

```bash
docker compose up -d postgres          # database only
cp backend/.env.example backend/.env
cd backend && npm ci && npm run migrate && npm run dev     # API on :5000
cd frontend && npm ci && npm run dev                       # UI on :5173
```

### Environment variables (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `DATABASE_URL` | `postgresql://finedge:finedge@localhost:5433/finedge` | PostgreSQL connection |
| `JWT_SECRET` | dev-only value | **Set a long random value outside local development** |
| `JWT_EXPIRES_IN` | `2h` | Token lifetime |
| `CORS_ORIGIN` | `*` | Allowed browser origin |
| `AI_API_KEY` | *(empty)* | Optional. Enables AI-written insights; never sent to the browser |
| `AI_MODEL` | `claude-haiku-4-5-20251001` | Model used when a key is set |

Frontend: `VITE_API_URL` (default `http://localhost:5000`).

## API

All routes are under `/api`; everything except `auth/register` and `auth/login` needs `Authorization: Bearer <jwt>`. Errors use `{ "success": false, "error": { "code", "message", "details?" } }`.

`POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `GET|POST /categories` · `PUT|DELETE /categories/:id` · `GET|POST /transactions` · `GET|PUT|DELETE /transactions/:id` · `GET|POST /budgets` · `GET|PUT|DELETE /budgets/:id` · `GET /dashboard` · `GET /analytics?months=` · `GET /insights`

## Testing

PostgreSQL must be reachable for the integration and end-to-end tests (`docker compose up -d postgres`; the test databases `finedge_test` / `finedge_e2e` are created on demand — `cd backend && DATABASE_URL=postgresql://finedge:finedge@localhost:5433/finedge_test node scripts/ensure-db.js` once for the integration database).

| Command | Where | What |
|---|---|---|
| `npm run lint` | backend, frontend | ESLint |
| `npm run test:unit` | backend (135 tests), frontend (39) | Vitest; frontend adds React Testing Library |
| `npm run test:integration` | backend (75 tests) | Supertest against the real Express app and a real PostgreSQL `*_test` database |
| `npm run test:mutation` | backend | StrykerJS on the business-logic modules (fails below 80 %) |
| `npm run test:coverage` | backend, frontend | V8 coverage |
| `npm run test:e2e` | frontend | Playwright, real browser + API + DB, 1440×900 |
| `npm run test:regression` | frontend | the same suite at 1440×900, 1280×800 and 390×844 |
| `npm run build` | frontend | production bundle |

`npm test` in `backend` runs unit then integration. Details and results: [`docs/review3/TESTING.md`](docs/review3/TESTING.md).

## Build and deployment

`npm run build` (frontend) emits static files to `frontend/dist`; the backend is a plain Node process (`npm start`). The provided Dockerfiles build both images (CI builds them on every push); the frontend image currently serves the Vite dev server, so put a static host or reverse proxy in front of `dist` for production and set `JWT_SECRET`, `CORS_ORIGIN` and `VITE_API_URL` at build time.

## Branching strategy

GitHub Flow: `main` is always releasable; work happens on short-lived branches merged with `--no-ff` (ideally through a pull request):

- `feature/*` — product work (`feature/backend-api`, `feature/frontend-integration`, `feature/testing`, `feature/mutation-hardening`)
- `ci/*` — pipeline changes · `docs/*` — documentation
- Commits follow Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `ci:`, `build:`). Releases are tagged `vX.Y.Z` (`v1.0.0` is the Review 3 release).

## Team

Developed by **vehladkid** (GitHub) as a university Software Engineering project (Digital Assignment 3 / Review 3).
