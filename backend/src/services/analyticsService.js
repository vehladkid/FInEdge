import * as repo from "../repositories/analytics.js";
import * as transactions from "../repositories/transactions.js";
import * as budgets from "../repositories/budgets.js";
import { addDays, endOfMonth, shiftMonths, startOfMonth } from "../utils/dates.js";
import { monthlySeries, summarize, withShares } from "./analyticsCalc.js";
import { withStatus } from "./budgetService.js";

export async function dashboard(userId, today) {
  const monthStart = startOfMonth(today);
  const [allTime, month, byCategory, recent, active] = await Promise.all([
    repo.totalsByType(userId),
    repo.totalsByType(userId, monthStart, endOfMonth(today)),
    repo.expensesByCategory(userId, monthStart, endOfMonth(today)),
    transactions.recent(userId, 5),
    budgets.listActive(userId, today),
  ]);
  const monthSummary = summarize(month);
  return {
    balance: summarize(allTime).balance,
    month: { income: monthSummary.income, expenses: monthSummary.expenses, savingsRate: monthSummary.savingsRate },
    spendingByCategory: withShares(byCategory),
    recentTransactions: recent,
    budgets: active.map(withStatus),
    hasData: recent.length > 0,
  };
}

export async function analytics(userId, today, months) {
  const from = shiftMonths(today, -(months - 1));
  const to = endOfMonth(today);
  const [monthly, byCategory, daily, totals] = await Promise.all([
    repo.monthlyTotals(userId, from, to),
    repo.expensesByCategory(userId, from, to),
    repo.dailyExpenses(userId, addDays(today, -29), today),
    repo.totalsByType(userId, from, to),
  ]);
  return {
    range: { from, to, months },
    summary: summarize(totals),
    monthly: monthlySeries(monthly, today, months),
    spendingByCategory: withShares(byCategory),
    dailySpending: daily,
  };
}
