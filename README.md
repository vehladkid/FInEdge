# FinEdge

An AI-powered personal finance and expense tracking web app.

> **Status:** Milestone skeleton (DA1 / Review 1). This repo currently proves
> the dev environment (frontend, backend, database) runs end-to-end in
> Docker. Auth, transactions, budgets, analytics, and AI insights are
> future work and are intentionally not implemented yet.

## Vision Document

### Project Overview
FinEdge is a web application that helps individuals track income and
expenses, organize spending into categories, and understand their
financial habits through simple analytics and AI-generated insights.

### Problem Statement
Most people don't have a clear, low-friction way to see where their money
goes each month. Spreadsheets are tedious and existing finance apps are
often bloated or paid. Users need a simple tool that tracks transactions
and explains spending patterns in plain language.

### Vision Statement
To be a lightweight, easy-to-use personal finance tracker that gives
students and young professionals AI-generated insight into their
spending habits, without the complexity of full-scale banking software.

### Target Users
- University students managing a limited monthly budget
- Young professionals tracking personal expenses
- Anyone who wants a simple income/expense tracker with basic analytics

### Key Features / Goals
- Secure user accounts (JWT-based auth)
- Add, edit, and delete income/expense transactions
- Default and custom categories
- Dashboard with balance and monthly income/expense summary
- Category-wise breakdown and income vs. expense trend analytics
- AI-generated natural-language spending insights
- Per-category monthly budgets with spend tracking

### Success Metrics
- User can register, log in, and record a transaction in under 1 minute
- Dashboard accurately reflects balance and monthly totals
- AI insight endpoint returns a relevant, readable summary in under 5s
- Core flows (auth, transactions, budgets) covered by manual test cases

### Assumptions & Constraints
- Single-currency support only (no multi-currency/exchange rates)
- No microservices, message queues (Kafka/RabbitMQ), or Kubernetes —
  monolithic REST API is in scope for this project's timeline
- LLM calls are limited to one summarization endpoint, not a chat UI
- Built and evaluated as a university Software Engineering assignment,
  not a production fintech product

## Software Design

Full design documentation lives in [`docs/design/`](docs/design/README.md).

**Architecture style:** layered monolith, deployed as three containers (frontend,
backend, PostgreSQL) through `docker-compose.yml`. This style was chosen because
the vision document above explicitly rules out microservices and queues for this
timeline, and because the repository's directory skeleton already implied these
layers — the design work populated those seams rather than replacing them.

**Frontend structure.** Screens in `src/pages/` compose a shared `PageShell`
layout and a `Card` primitive, and read their data from `src/services/`. Cross
-cutting concerns are separated out: `src/domain/categories.js` is the single
definition of a spending category, `src/utils/format.js` handles currency
rendering, and `src/theme.js` holds the design tokens shared by Tailwind and the
Recharts components.

**Backend structure.** `server.js` starts the process, `app.js` assembles the
Express application and registers routes, `routes/health.js` serves `GET /`, and
`config/index.js` is the only module that reads environment variables.
`server.js` is still the Docker entry point.

**Service/data abstraction.** Pages depend on functions such as `getBudgets()`
and `getDashboardSummary()` rather than owning data arrays. Those functions
currently return mock values; when real endpoints exist, their bodies call
`services/api.js` and the pages do not change. This is the seam that lets mock
data be replaced without rewriting the UI.

**Diagrams and prototype:** not yet produced. The Draw.io sources, PNG exports,
UI screenshots and Figma link are pending and will live in
`docs/design/diagrams/` and `docs/design/screenshots/`.

## Branching Strategy

This project follows **GitHub Flow**:

- `main` — always deployable; feature branches merge here via PR
- `feature/frontend` — frontend (React/Vite/Tailwind) work
- `feature/backend` — backend (Express API) work
- `feature/docker` — Dockerfiles and docker-compose work
- `feature/readme` — documentation updates

Work happens on a feature branch, gets opened as a PR against `main`,
and is merged once reviewed.

## Local Development Tools
- [VS Code](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)
- [Node.js 22](https://nodejs.org/) (for running frontend/backend outside Docker)

## Quick Start – Local Development

```bash
# 1. Clone the repo
git clone <YOUR_GITHUB_REPO_URL>
cd FinEdge

# 2. Copy backend env file
cp backend/.env.example backend/.env

# 3. Build and start all services (frontend, backend, postgres)
docker compose up --build
```

Once running:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Postgres: localhost:5433 (user: `finedge`, password: `finedge`, db: `finedge`)

To stop everything:

```bash
docker compose down
```
