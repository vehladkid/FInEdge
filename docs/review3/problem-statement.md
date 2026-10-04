# Problem Statement

## Background

Most people can say roughly what they earn but not where it goes. Keeping track normally means either a spreadsheet — which needs manual formulas, has no notion of budgets that update themselves, and is awkward on a phone — or a commercial finance app that can be bloated, paid, or tied to a bank connection the user may not want. A student or young professional with a modest, irregular income needs something lighter: a place to write down each income and expense, see a total at a glance, and be told when a category is getting out of hand.

## Problem

There is a need for a small web application that lets an individual:

1. **Authenticate securely**, so that financial records are private to their owner.
2. **Record income and expenses** quickly, and correct or remove them later.
3. **Organise transactions into categories**, including categories of their own.
4. **Set budgets** per spending category and period, and know at any moment how much of each is used — based on what was actually recorded, not on a number typed in by hand.
5. **Monitor financial performance** through a dashboard (balance, month totals, recent activity, budget status).
6. **Analyse trends** — income versus expenses over time, spending by category, daily spending, savings rate.
7. **Receive financial insights** in plain language: unusual spending, budgets approaching or exceeding their limit, overspending, and the savings rate.

## Constraints that shape the solution

- **Scope.** A single-currency, single-user-per-account system. There are no bank integrations, multi-currency conversion, shared accounts, microservices or message queues; the design is a monolithic REST API with one relational database.
- **Correctness of money.** Amounts are stored as exact decimals (`NUMERIC(12,2)`), must be positive, and budget figures are derived on the server from the transaction table so that the dashboard, the budget screen and the insights can never disagree.
- **Privacy and security.** Passwords are stored only as bcrypt hashes; sessions are signed JWTs; every query is scoped to the authenticated user so one user can never read or alter another's data. The optional AI feature receives only aggregated monthly figures — never names, e-mail addresses or individual transactions — and the application must work fully without it.
- **Usability.** The interface must work on a phone as well as a desktop, and every screen must show a clear loading, error and empty state rather than invented values.
- **Maintainability and quality.** The system is built to be tested: business rules are pure functions covered by unit and mutation tests; the API is covered by integration tests against a real database; user journeys are covered by browser regression tests; and the whole pipeline runs in CI.

## Objective

Deliver FinEdge: a React single-page application backed by an Express API and a PostgreSQL database that satisfies the needs above, reproducibly deployable with Docker, and verified by the automated tests described in this report.

## Out of scope

Bank synchronisation, receipts/attachments, recurring transactions, data export, password reset by e-mail, multi-currency, and mobile native apps.
