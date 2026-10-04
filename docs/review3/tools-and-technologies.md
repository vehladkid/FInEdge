# Tools and Technologies

| Area | Technology | Version (lockfile) | Used for |
|---|---|---|---|
| Runtime | Node.js | 22 | Backend runtime, tooling |
| Backend | Express | 4.x | REST API |
| | node-postgres (`pg`) | 8.x | PostgreSQL client |
| | bcryptjs | 3.x | Password hashing |
| | jsonwebtoken | 9.x | Session tokens |
| | zod | 4.x | Request validation |
| Database | PostgreSQL | 16 | Persistent storage; SQL migrations (`backend/src/db/migrations`) |
| Frontend | React | 18 | UI |
| | Vite | 5 | Dev server and bundler |
| | Tailwind CSS | 3 | Styling |
| | Recharts | 3 | Charts |
| | react-router | 7 | Routing |
| Unit/integration testing | Vitest | 3 | Test runner (backend and frontend) |
| | Supertest | 7 | HTTP integration tests against the Express app |
| | React Testing Library, user-event, jest-dom, jsdom | latest | Component tests |
| | V8 coverage (`@vitest/coverage-v8`) | 3 | Coverage |
| Regression / E2E | Playwright | 1.63 | Real-browser tests at 3 viewports; screenshot capture |
| Mutation testing | StrykerJS (`@stryker-mutator/core`, `vitest-runner`) | 10 | Mutation score on business logic |
| Quality | ESLint (+ react, react-hooks plugins in the frontend) | 10 backend / 9 frontend | Static analysis |
| Containers | Docker, Docker Compose | — | Run frontend, backend and PostgreSQL |
| CI | GitHub Actions | — | `.github/workflows/ci.yml` |
| Version control | Git, GitHub | — | GitHub Flow, Conventional Commits, `v1.0.0` tag |
| Documentation | Markdown, Mermaid | 11 | SRS, architecture, DFD/ERD/UML sources (`docs/review3/diagrams/*.mmd`) |
| Report tooling | marked, Playwright (PDF) | — | Builds the report and evidence PDFs from the repository (`docs/review3/tools/`) |
| Optional | Anthropic Messages API | — | AI-written insights when `AI_API_KEY` is set |

Exact versions are pinned in `backend/package-lock.json`, `frontend/package-lock.json` and `docs/review3/tools/package-lock.json`.
