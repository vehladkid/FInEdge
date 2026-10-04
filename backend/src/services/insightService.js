import * as repo from "../repositories/analytics.js";
import * as budgets from "../repositories/budgets.js";
import { endOfMonth, shiftMonths, startOfMonth } from "../utils/dates.js";
import { summarize } from "./analyticsCalc.js";
import { withStatus } from "./budgetService.js";
import { generateInsights } from "./insightRules.js";
import { aiInsights } from "./aiClient.js";

export async function getInsights(userId, today, ai = aiInsights) {
  const thisStart = startOfMonth(today);
  const lastStart = shiftMonths(today, -1);
  const [thisTotals, lastTotals, catThis, catLast, active] = await Promise.all([
    repo.totalsByType(userId, thisStart, endOfMonth(today)),
    repo.totalsByType(userId, lastStart, endOfMonth(lastStart)),
    repo.expensesByCategory(userId, thisStart, endOfMonth(today)),
    repo.expensesByCategory(userId, lastStart, endOfMonth(lastStart)),
    budgets.listActive(userId, today),
  ]);
  const input = {
    summary: summarize(thisTotals),
    categoryThisMonth: catThis,
    categoryLastMonth: catLast,
    budgets: active.map(withStatus),
    previousExpenses: summarize(lastTotals).expenses,
  };

  try {
    const generated = await ai({
      thisMonth: input.summary,
      lastMonthExpenses: input.previousExpenses,
      categoriesThisMonth: catThis.map((c) => ({ name: c.name, total: c.total })),
      categoriesLastMonth: catLast.map((c) => ({ name: c.name, total: c.total })),
      budgets: input.budgets.map((b) => ({ category: b.category, amount: b.amount, spent: b.spent, status: b.status })),
    });
    if (generated?.length) return { source: "ai", insights: generated };
  } catch {
    // Provider unreachable or malformed answer: the rule engine always answers.
  }
  return { source: "rule-based", insights: generateInsights(input) };
}
