# FinEdge — Current State (baseline before Review 3 work)

Recorded 2026-10-04 on branch `main` (clean tree), Node 22.23.1 / npm 10.9.8.

## Architecture
Layered monolith in three Docker containers (`docker-compose.yml`): React/Vite frontend (5173), Express backend (5000), PostgreSQL 16 (5433).

- **Frontend** (`frontend/`): React 18, react-router 7, Tailwind 3, Recharts. Pages in `src/pages/` (Landing, Login, Dashboard, Analytics, Budget, AddTransaction) read data through `src/services/finance.js` (hard-coded mock values). `src/services/api.js` only calls `GET /`. `src/domain/categories.js` and `src/utils/format.js` are the only real logic.
- **Backend** (`backend/`): Express 4 + cors. `app.js` (importable, no port), `server.js`, `config/index.js` (PORT only), `routes/health.js` (`GET /`). `controllers/`, `models/`, `middleware/` are empty `.gitkeep` folders.
- **Database**: container runs, but there is no schema, migration or client; `DATABASE_URL` is never read.

## Existing functionality
- Landing, demo login (hard-coded `student@vit.edu` / `demo1234`, no JWT), dashboard/analytics on mock data.
- Budget creation in component state only (lost on refresh).
- Add-transaction form only `console.log`s.
- Backend health check.

## Existing tests
Only `frontend/src/utils/format.check.js` (plain node assertions for `formatCurrency`; passes). No framework, no test scripts, no backend tests.

## Baseline commands
| Command | Result |
|---|---|
| `npm ci` (backend, frontend) | pass; `npm audit` reports high/moderate vulnerabilities in the frontend |
| `npm run lint` | **does not exist** (no ESLint config in either package) |
| `npm run build` (frontend) | pass; warns one chunk is 608 kB (>500 kB) |
| `node src/utils/format.check.js` | pass |
| backend start + `GET /` | pass, returns `{"message":"Welcome to FinEdge API 🚀"}` |
| backend build | none (plain JS) |

## Git
6 commits, single author (vehladkid), 31 Jul – 11 Sep 2026. Branches: `main`, `feature/software-design`. No tags, no CI. README's branching section lists branches that do not exist.

## Missing for Review 3
Integration, regression and mutation tests; CI; real auth/transactions/budgets/analytics/AI insights persistence; lint config; diagrams, SRS, user stories, report, evidence PDF, screenshots; release tag.

## Note on the Review 3 brief
The pasted brief describes a different project (Craftdexa: `connectForms.ts`, `oorruActivity.ts`, `/api/connect`, Resend). None of those exist in this repository.
