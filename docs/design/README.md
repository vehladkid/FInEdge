# FinEdge — Software Design

> **Scope note.** FinEdge is currently a working prototype: the UI is complete and
> navigable, but the data it displays is mock data and the backend exposes a single
> health endpoint. Budget creation is the one interactive feature — it adds to
> component state and is not persisted. This document describes the architecture
> **as it actually exists in the repository**. Where something is planned rather
> than built, it says so.

## Architecture style

**Layered monolith**, deployed as three containers (frontend, backend, PostgreSQL)
via `docker-compose.yml`.

### Why layered, and why not something else

1. **The project's own constraints require it.** The vision document in the root
   README rules out microservices, message queues and Kubernetes for this
   timeline. An architecture that contradicts a stated constraint is the wrong
   architecture regardless of how modern it looks.
2. **The repository already declared these layers.** Directories such as
   `services/`, `layouts/`, `utils/`, `routes/` and `config/` existed from the
   first commit but were empty. This design work *populated the seams that were
   already drawn* rather than replacing them.
3. **It matches the delivery constraints.** One deployable unit per tier is the
   right cost/benefit point for a small team; distributed architecture would add
   operational overhead with no delivery benefit at this size.

## Frontend layers

```
pages/       screen composition — what a route shows
  ↓
layouts/     PageShell: shared page frame (background, nav, heading, main)
components/  NavBar; ui/Card — reusable presentation primitives
  ↓
services/    api.js     — owns the API base URL and all fetch calls
             finance.js — supplies screen data (currently mock)
  ↓
domain/      categories.js — the category concept: id, label, shortLabel
utils/       format.js     — formatCurrency
theme.js     design tokens shared by Tailwind and Recharts
```

A page imports downward only. No service imports a page; no domain module imports
a service. Verified with `contextro circular_dependencies`: **0 cycles**.

## Backend layers

```
server.js         process startup — listen() only
  ↓
app.js            Express app: middleware + route registration
  ↓
routes/health.js  GET / → { "message": "Welcome to FinEdge API 🚀" }
config/index.js   the only module that reads process.env
```

`server.js` remains the Docker and npm entry point, so the split changed no
deployment configuration.

`backend/src/controllers/`, `models/` and `middleware/` are still empty. They are
left in place as named seams for future work and are **not** described here as
implemented.

## How the design principles are demonstrated

Each claim below points at code that exists in this repository.

### Abstraction

- `PageShell` hides the page frame. Screens declare *what* they show, not how the
  background, nav and heading are assembled.
- `formatCurrency(amount, decimals)` replaced three different inline approaches
  (a hardcoded `"$4,250"` string, a `${b.spent}` template, and `.toFixed(2)` with
  a hand-written sign).
- `theme.js` names colours by role (`surface`, `panel`, `edge`, `brand`) instead of
  repeating hex literals.
- `getApiHealth()` hides the transport. The landing page no longer knows the app
  uses `fetch`, or where the backend lives.

### Modularity

- The frontend is split into pages, layouts, components, services, domain and
  utils, each independently replaceable.
- `Card` and `PageShell` are used by four screens each; changing either is a
  one-file edit instead of a four-file edit.
- The backend's startup, application assembly, routing and configuration are four
  separate files with one reason to change each.

### Cohesion

- `services/finance.js` holds screen data and nothing else; `domain/categories.js`
  holds the category concept and nothing else.
- `Landing.jsx` previously mixed marketing copy with a backend health probe. The
  probe now lives in the service layer, leaving the page responsible only for
  presentation.
- `config/index.js` is the single place environment variables are read.

### Low coupling

- **The category defect this fixed is the clearest example.** "Food & Dining" and
  "Food" were three independent literals across three files that had already
  drifted apart. They are now one record with an `id`, a `label` and a
  `shortLabel`, so the pie chart keeps its compact "Food" while the form and
  budget list keep "Food & Dining" — same concept, one definition.
- Pages depend on *function signatures* (`getBudgets()`), not on data literals.
- Only `services/api.js` knows the backend URL.

## How mock data is replaced with real API data later

This is the point of the service layer. Today:

```js
// services/finance.js
const BUDGET_ALLOCATIONS = [ { id: "food", spent: 340, allocated: 400 }, /* … */ ];
export const getBudgets = () => BUDGET_ALLOCATIONS.map(/* … */);
```

`Budget.jsx` calls `getBudgets()` and renders the result. When a real endpoint
exists, the body of `getBudgets` calls `api.js` instead. **The page does not
change.**

One honest limitation: these functions are **synchronous**. Making them `async`
now would have forced loading and error states into screens that have none —
a UI change, not an architectural one. Introducing `async` is therefore part of
the work of wiring real endpoints, and the service boundary is what keeps that
change contained to the service and the pages that show loading state.

## Verification

The refactor was required to be behaviour-preserving. It was checked by running the
pre-refactor build (the Docker container, port 5173) and the post-refactor build
(port 4180) side by side and comparing rendered text on every route. All screens
matched exactly, including the compiled CSS for the new theme tokens.

## Deliverables status

| Item | Status |
|---|---|
| Architecture described | ✅ this document |
| Layered structure implemented | ✅ frontend and backend |
| Draw.io architecture diagram (editable) | ⏳ not yet created — `diagrams/` |
| PNG diagram exports | ⏳ not yet created — `diagrams/` |
| UI screenshots | ⏳ not yet captured — `screenshots/` |
| Figma prototype link | ⏳ not yet provided |
| Code snippets for the report | ⏳ `code-snippets/` |

Nothing in the table above is claimed complete before it exists.

## Folder layout

```
docs/design/
├── README.md        this document
├── diagrams/        Draw.io sources (.drawio) + PNG exports
├── screenshots/     UI screenshots of the six screens
└── code-snippets/   extracts referenced by the design report
```
