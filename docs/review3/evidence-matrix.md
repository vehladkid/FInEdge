# DA3 Evidence Matrix

Every Review 3 requirement, where it is implemented, how it is verified, and where the evidence is. "Evidence PDF" = `FinEdge-DA3-Evidence.pdf`; "Report PDF" = `FinEdge-DA3-Report.pdf`. Screenshot paths are relative to `docs/review3/`; raw command output is in `evidence/logs/`.

## A. Single evidence PDF

| DA3 requirement | Implementation | Source / test | Screenshot / log | Evidence PDF |
|---|---|---|---|---|
| Integration testing | Supertest against the real Express app + PostgreSQL, 75 tests | `backend/tests/integration/*.test.js`, `vitest.integration.config.js` | `screenshots/evidence/integration-backend.png`, `coverage-backend.png`; `evidence/logs/04-*.txt`, `05-*.txt` | §1 |
| (supporting) Unit testing | Vitest, 135 backend + 39 frontend tests | `backend/tests/unit`, `frontend/tests/unit` | `unit-backend.png`, `unit-frontend.png`, `coverage-frontend.png`; logs `03`, `05b`, `09`, `10` | §1 |
| Regression testing | Playwright suite on the real stack at 1440×900, 1280×800, 390×844 (120 passes) | `frontend/tests/e2e/*.spec.js`, `frontend/playwright.config.js` | `regression-e2e.png`, `app/mobile-14-mobile-menu.png`; log `12-*.txt` | §2 |
| Mutation testing | StrykerJS, 10 logic modules, 96.53 % | `backend/stryker.config.json`; survivors in `evidence/mutation-summary.md` | `mutation-backend.png`; log `06-*.txt` | §3 |
| Version management | GitHub Flow branches merged `--no-ff`, Conventional Commits, tag `v1.0.0` | `git log`, `README.md` (Branching strategy) | `git-log-graph.png`, `git-branches.png`, `git-tags.png`, `git-commits-remote.png`, `git-shortlog.png`, `screenshots/github/{repository,branches,tags,commits}.png`; logs `20`–`24` | §4 |
| System building | npm scripts, Vite build, Dockerfiles, Compose stack, CI workflow | `frontend/package.json`, `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml` | `build-frontend.png`, `lint-*.png`, `docker-*.png`, `docker-compose-ps.png`, `ci-workflow.png`, `screenshots/github/{actions,ci-run}.png` (CI #1 green); logs `02`, `08`, `11`, `13`, `14`, `25`, `26` | §5 |
| Screenshots of developed functionalities | Running application, real data | `frontend/tests/screenshots/capture.spec.js` (Playwright) | `screenshots/app/desktop-*.png`, `mobile-*.png` | §6, §6b |
| Tools/technologies used | package manifests | `backend/package.json`, `frontend/package.json`, `tools-and-technologies.md` | `dependencies.png`; log `27-*.txt` | §7 |

## B. Live demo
Run `docker compose up --build`, open http://localhost:5173, register, add transactions, create budgets, open Analytics and Insights (README, "Quick start"). The same flows are scripted in `frontend/tests/screenshots/capture.spec.js`.

## C. Project report PDF

| Report section | Source document | Report PDF |
|---|---|---|
| Problem statement | `problem-statement.md` | §1 |
| User stories | `user-stories.md` (mapped to features and tests) | §2 |
| System architecture and design | `architecture.md` + component diagram + UI figures | §3 |
| Design of tests | `design-of-tests.md`, `TESTING.md` | §4 |
| Appendix A — SRS | `srs.md` | App. A |
| Appendix B — DFD | `diagrams/dfd-level-0.mmd/.png`, `dfd-level-1.mmd/.png` | App. B |
| Appendix C — ERD | `diagrams/erd.mmd/.png`, schema `backend/src/db/migrations/001_init.sql` | App. C |
| Appendix D — UML | `uml-use-case`, `uml-component`, `uml-class`, `uml-sequence-login`, `uml-sequence-transaction`, `uml-activity` (`.mmd`/`.png`) | App. D |
| Appendix E — Code listing / GitHub link | https://github.com/vehladkid/FInEdge + representative listings | App. E |

## D. Requirement → test traceability
Functional requirements FR-01…FR-23 are traced to tests in `user-stories.md` (stories US-01…US-13) and in the Design of Tests §3.
