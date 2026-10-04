# Software Requirements Specification — FinEdge v1.0.0

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements of FinEdge, a personal finance management web application, as implemented in release v1.0.0. It is written for the course evaluators, developers and testers; every requirement below corresponds to behaviour that exists in the repository and, where stated, to an automated test.

### 1.2 Scope
FinEdge lets a registered user record income and expenses, organise them into categories, set budgets, and view a dashboard, analytics and insights. It consists of a React single-page application, an Express REST API and a PostgreSQL database. It does not integrate with banks, support multiple currencies, or provide recurring transactions or data export.

### 1.3 Definitions
**Transaction** — one income or expense record. **Category** — a user-owned label of type income or expense. **Budget** — a spending limit for one expense category over a weekly, monthly or yearly period. **JWT** — JSON Web Token used as the session credential.

### 1.4 Intended users
Individuals — typically students and young professionals — managing personal income and expenses. There is one user role: *registered user*. Unauthenticated visitors can see the landing page, register and log in.

## 2. Overall description

- **Product perspective:** a self-contained three-tier web system (browser → API → database), deployable with Docker Compose.
- **Operating environment:** modern evergreen browsers; Node.js 22; PostgreSQL 16.
- **Constraints:** single currency; monolithic REST API; no external service is required (the AI provider is optional).
- **Assumptions:** users have a modern browser with JavaScript; the server clock is correct (date ranges use UTC dates); PostgreSQL is available to the API.
- **Dependencies:** Express, `pg`, `bcryptjs`, `jsonwebtoken`, `zod`, React, Vite, Tailwind, Recharts, react-router; optional Anthropic Messages API.

## 3. Functional requirements

### Authentication
| ID | Requirement |
|---|---|
| FR-01 | The system shall register a user from name (1–100 characters), e-mail (valid, ≤ 254) and password (8–72 characters with at least one letter and one digit). |
| FR-02 | The system shall reject registration with an e-mail already in use, compared case-insensitively, including under concurrent requests (HTTP 409). |
| FR-03 | The system shall store only a bcrypt hash of the password and shall never return it. |
| FR-04 | The system shall authenticate by e-mail and password and return a signed JWT valid for 2 hours; an unknown e-mail and a wrong password shall produce the same 401 response. |
| FR-05 | All routes other than registration, login and the health check shall require a valid bearer JWT; missing, malformed, expired or forged tokens shall yield 401. |
| FR-06 | The UI shall redirect unauthenticated visitors from protected pages to the login page, return them to the requested page after login, and discard invalid or expired tokens. |
| FR-07 | A new account shall receive nine default categories (six expense, three income). |

### Transactions
| ID | Requirement |
|---|---|
| FR-08 | The system shall create transactions with type (income/expense), amount (> 0, ≤ 2 decimals), category, date (valid `YYYY-MM-DD`) and optional description (≤ 200). |
| FR-09 | The category of a transaction shall belong to the same user and have the same type as the transaction. |
| FR-10 | The system shall read one transaction and list transactions newest first with pagination (default 20, max 100) and filters by type, category and inclusive date range; `from` shall not be after `to`. |
| FR-11 | The system shall update and delete transactions. |
| FR-12 | A user shall never read, modify or delete another user's transactions (responses are 404). |

### Categories
| ID | Requirement |
|---|---|
| FR-13 | The system shall list (optionally by type), create and rename categories; names are unique per user and type (409 on duplicates). |
| FR-14 | The system shall refuse to delete a category used by transactions (409, with the count) and shall delete unused categories together with their budgets. |

### Budgets
| ID | Requirement |
|---|---|
| FR-15 | The system shall create, read, update and delete budgets (amount > 0; period weekly, monthly or yearly; start date). The end date shall be derived from the period; budgets may only target expense categories; a category, period and start date combination is unique. |
| FR-16 | For every budget the system shall compute — in the database/backend — `spent` (sum of the user's expenses in that category between start and end dates inclusive), `remaining`, `percentUsed` (one decimal), `exceeded` (spent strictly greater than amount) and `status`: `ok`, `warning` (≥ 80 %) or `exceeded`. |

### Reporting
| ID | Requirement |
|---|---|
| FR-17 | `GET /api/dashboard` shall return the all-time balance, current-month income, expenses and savings rate, current-month spending by category with share, the five most recent transactions and the budgets active today. |
| FR-18 | `GET /api/analytics?months=N` (1–24, default 6) shall return a zero-filled monthly income/expense/net series, spending by category, daily spending for the last 30 days and range totals. |
| FR-19 | `GET /api/insights` shall return insights derived from the user's data: budget exceeded or near limit, category spend spikes (≥ 20 % and ≥ $20), a dominant category (≥ 40 %), month-over-month growth (≥ 20 %), overspending, and savings rate (< 10 % low, ≥ 20 % good). |
| FR-20 | If an AI provider key is configured the system shall try the provider with aggregated figures only; on any failure or empty answer it shall return the rule-based insights. The response states its `source`. |

### User interface
| ID | Requirement |
|---|---|
| FR-21 | The UI shall provide pages for landing, registration, login, dashboard, transactions (list/edit/delete/filter), add transaction, categories, budgets and analytics. |
| FR-22 | Each data page shall show loading, error (with retry) and empty states and shall not display invented values. |
| FR-23 | The UI shall be usable at 390×844, 1280×800 and 1440×900 without horizontal scrolling, with a collapsible navigation on narrow screens. |

## 4. External interfaces

- **User interface:** the pages listed in FR-21.
- **HTTP API:** JSON over HTTP; success `{ "success": true, "data", "meta?" }`; failure `{ "success": false, "error": { "code", "message", "details?" } }`. Routes are listed in the README.
- **Database interface:** PostgreSQL via `pg`; schema in `backend/src/db/migrations/001_init.sql`.
- **AI provider (optional):** Anthropic Messages API (`POST https://api.anthropic.com/v1/messages`).

## 5. Database requirements
Four tables — `users`, `categories`, `transactions`, `budgets` — with the keys, `CHECK` constraints and indexes shown in the ERD. Money is `NUMERIC(12,2)`. Deleting a user cascades to all their rows; deleting a category is restricted by transactions and cascades to budgets. The schema is created only by versioned migrations (`schema_migrations` records applied files).

## 6. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Security | Passwords hashed with bcrypt (cost configurable, default 10); JWT signed with a server secret; the secret and AI key are read only from the environment and never reach the browser. |
| NFR-02 | Security | Every data query is filtered by the authenticated user id; request bodies are limited to 100 kB; all input is validated before use; SQL uses parameters only. |
| NFR-03 | Reliability | Errors return a consistent JSON shape; in production the cause of unexpected errors is never exposed. |
| NFR-04 | Performance | Dashboard and analytics are computed by database aggregation instead of transferring every transaction; lists are paginated; indexes cover user/date and category lookups. *(Not load-tested.)* |
| NFR-05 | Usability | Responsive layout; labelled form controls; `role="alert"`/`status` messages; progress bars expose `aria-valuenow`. |
| NFR-06 | Portability | `docker compose up --build` starts the whole system; migrations run on backend start and wait for the database. |
| NFR-07 | Maintainability | Layered code; pure logic isolated; ESLint clean; CI on every push. |
| NFR-08 | Testability | Unit, integration, regression (3 viewports) and mutation tests; see the Design of Tests. |

## 7. Constraints
Single currency; UTC date arithmetic; password maximum of 72 characters (bcrypt input limit); the frontend Docker image runs the Vite dev server and is intended for development/demonstration rather than production serving.

## 8. Traceability
Requirement-to-test traceability is given in `user-stories.md` and `evidence-matrix.md`.
