import { round2 } from "../utils/money.js";
import { shiftMonths } from "../utils/dates.js";

// Totals from [{type, total}] rows (already aggregated by the database).
export function summarize(rows) {
  let income = 0;
  let expenses = 0;
  for (const row of rows) {
    if (row.type === "income") income += row.total;
    else if (row.type === "expense") expenses += row.total;
  }
  income = round2(income);
  expenses = round2(expenses);
  return {
    income,
    expenses,
    balance: round2(income - expenses),
    savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 1000) / 10 : null,
  };
}

// Month keys ("YYYY-MM") for the `count` months ending with the month of `today`.
export function monthKeys(today, count) {
  const keys = [];
  for (let i = count - 1; i >= 0; i--) keys.push(shiftMonths(today, -i).slice(0, 7));
  return keys;
}

// Turns sparse [{month, type, total}] rows into one entry per month, zero-filled.
export function monthlySeries(rows, today, count) {
  return monthKeys(today, count).map((month) => {
    const income = rows.filter((r) => r.month === month && r.type === "income").reduce((s, r) => s + r.total, 0);
    const expenses = rows.filter((r) => r.month === month && r.type === "expense").reduce((s, r) => s + r.total, 0);
    return { month, income: round2(income), expenses: round2(expenses), net: round2(income - expenses) };
  });
}

// Adds each category's share (percent of the total) to [{categoryId, name, total}].
export function withShares(rows) {
  const sum = rows.reduce((s, r) => s + r.total, 0);
  return rows.map((r) => ({
    ...r,
    total: round2(r.total),
    share: sum > 0 ? Math.round((r.total / sum) * 1000) / 10 : 0,
  }));
}
