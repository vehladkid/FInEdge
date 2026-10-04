# Mutation testing summary (generated)

Tool: StrykerJS 10.0.0 with the Vitest runner. **Mutation score: 96.53%** — 527 killed, 1 timed out (counted as detected), 19 survived, 0 without coverage.

| File | Killed | Timeout | Survived | Score |
|---|---:|---:|---:|---:|
| `src/errors/index.js` | 11 | 0 | 0 | 100.00% |
| `src/middleware/errorHandler.js` | 35 | 0 | 0 | 100.00% |
| `src/services/aiClient.js` | 44 | 0 | 4 | 91.67% |
| `src/services/analyticsCalc.js` | 70 | 1 | 0 | 100.00% |
| `src/services/budgetCalc.js` | 23 | 0 | 0 | 100.00% |
| `src/services/insightRules.js` | 147 | 0 | 5 | 96.71% |
| `src/utils/dates.js` | 65 | 0 | 5 | 92.86% |
| `src/utils/money.js` | 4 | 0 | 0 | 100.00% |
| `src/utils/password.js` | 28 | 0 | 0 | 100.00% |
| `src/validators/index.js` | 100 | 0 | 5 | 95.24% |

## Surviving mutants (19)

| Location | Mutator | Original | Mutated to |
|---|---|---|---|
| `src/services/aiClient.js:31` | OptionalChaining | `body.content?.[0]?.text` | `body.content?.[0].text` |
| `src/services/aiClient.js:31` | OptionalChaining | `body.content?.[0]` | `body.content[0]` |
| `src/services/aiClient.js:31` | StringLiteral | `""` | `"Stryker was here!"` |
| `src/services/aiClient.js:38` | StringLiteral | `"info"` | `""` |
| `src/services/insightRules.js:54` | EqualityOperator | `summary.expenses > 0` | `summary.expenses >= 0` |
| `src/services/insightRules.js:54` | ConditionalExpression | `summary.expenses > 0` | `true` |
| `src/services/insightRules.js:66` | EqualityOperator | `summary.expenses > previousExpenses` | `summary.expenses >= previousExpenses` |
| `src/services/insightRules.js:66` | ConditionalExpression | `summary.expenses > previousExpenses` | `true` |
| `src/services/insightRules.js:104` | ConditionalExpression | `summary.income === 0` | `true` |
| `src/utils/dates.js:7` | ConditionalExpression | `typeof value !== "string"` | `false` |
| `src/utils/dates.js:7` | ConditionalExpression | `typeof value !== "string" \|\| !ISO.test(value)` | `false` |
| `src/utils/dates.js:7` | LogicalOperator | `typeof value !== "string" \|\| !ISO.test(value)` | `typeof value !== "string" && !ISO.test(value)` |
| `src/utils/dates.js:4` | Regex | `/^\d{4}-\d{2}-\d{2}$/` | `/\d{4}-\d{2}-\d{2}$/` |
| `src/utils/dates.js:4` | Regex | `/^\d{4}-\d{2}-\d{2}$/` | `/^\d{4}-\d{2}-\d{2}/` |
| `src/validators/index.js:11` | StringLiteral | `"."` | `""` |
| `src/validators/index.js:25` | EqualityOperator | `Math.abs(n * 100 - Math.round(n * 100)) < 1e-6` | `Math.abs(n * 100 - Math.round(n * 100)) <= 1e-6` |
| `src/validators/index.js:39` | StringLiteral | `"custom"` | `""` |
| `src/validators/index.js:48` | ObjectLiteral | `(multi-line expression)` | `{}` |
| `src/validators/index.js:75` | ObjectLiteral | `(multi-line expression)` | `{}` |
