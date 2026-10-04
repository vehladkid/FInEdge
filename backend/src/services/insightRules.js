import { round2 } from "../utils/money.js";

// Rule-based insight engine (pure). Input is already-aggregated data:
//   summary            {income, expenses, balance, savingsRate}  — current month
//   categoryThisMonth  [{name, total}]
//   categoryLastMonth  [{name, total}]
//   budgets            [{category, amount, spent, percentUsed, status}]
//   previousExpenses   total expenses last month
// Output: [{id, severity: "info"|"warning"|"critical"|"positive", message}]

export const SPIKE_PERCENT = 20; // category spend increase worth flagging
export const SPIKE_MIN_DELTA = 20; // ...but ignore tiny absolute changes
export const HIGH_CATEGORY_SHARE = 40; // one category dominating spending
export const LOW_SAVINGS_RATE = 10;
export const GOOD_SAVINGS_RATE = 20;

const money = (n) => `$${round2(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function generateInsights({ summary, categoryThisMonth, categoryLastMonth, budgets, previousExpenses }) {
  const out = [];

  for (const b of budgets) {
    if (b.status === "exceeded") {
      out.push({
        id: `budget-exceeded-${b.category}`,
        severity: "critical",
        message: `You have exceeded your ${b.category} budget by ${money(b.spent - b.amount)}.`,
      });
    } else if (b.status === "warning") {
      out.push({
        id: `budget-warning-${b.category}`,
        severity: "warning",
        message: `You have used ${b.percentUsed}% of your ${b.category} budget.`,
      });
    }
  }

  const lastByName = new Map(categoryLastMonth.map((c) => [c.name, c.total]));
  for (const c of categoryThisMonth) {
    const last = lastByName.get(c.name);
    if (last > 0) {
      const delta = c.total - last;
      const pct = Math.round((delta / last) * 100);
      if (pct >= SPIKE_PERCENT && delta >= SPIKE_MIN_DELTA) {
        out.push({
          id: `spike-${c.name}`,
          severity: "warning",
          message: `You spent ${pct}% more on ${c.name} this month than last month.`,
        });
      }
    }
  }

  if (summary.expenses > 0 && categoryThisMonth.length > 0) {
    const top = categoryThisMonth.reduce((a, b) => (b.total > a.total ? b : a));
    const share = Math.round((top.total / summary.expenses) * 100);
    if (share >= HIGH_CATEGORY_SHARE) {
      out.push({
        id: "top-category",
        severity: "info",
        message: `${top.name} is your biggest expense category at ${money(top.total)} (${share}% of spending).`,
      });
    }
  }

  if (previousExpenses > 0 && summary.expenses > previousExpenses) {
    const pct = Math.round(((summary.expenses - previousExpenses) / previousExpenses) * 100);
    if (pct >= SPIKE_PERCENT) {
      out.push({
        id: "expenses-up",
        severity: "warning",
        message: `Total spending is up ${pct}% compared with last month.`,
      });
    }
  }

  if (summary.income > 0 && summary.expenses > summary.income) {
    out.push({
      id: "overspending",
      severity: "critical",
      message: `You have spent ${money(summary.expenses - summary.income)} more than you earned this month.`,
    });
  } else if (summary.savingsRate !== null) {
    if (summary.savingsRate >= GOOD_SAVINGS_RATE) {
      out.push({
        id: "savings-good",
        severity: "positive",
        message: `You are saving ${summary.savingsRate}% of your income this month.`,
      });
    } else if (summary.savingsRate < LOW_SAVINGS_RATE) {
      out.push({
        id: "savings-low",
        severity: "warning",
        message: `Your savings rate is only ${summary.savingsRate}% this month.`,
      });
    }
  }

  if (out.length === 0) {
    out.push({
      id: "no-insights",
      severity: "info",
      message:
        summary.income === 0 && summary.expenses === 0
          ? "Add some transactions this month to start receiving insights."
          : "Nothing unusual this month. Your spending looks steady.",
    });
  }
  return out;
}
