import { describe, it, expect } from "vitest";
import { generateInsights } from "../../src/services/insightRules.js";

const base = {
  summary: { income: 0, expenses: 0, balance: 0, savingsRate: null },
  categoryThisMonth: [], categoryLastMonth: [], budgets: [], previousExpenses: 0,
};
const THIRDS = (t) => ["A", "B", "C"].map((name) => ({ name, total: t / 3 }));
const run = (over) => generateInsights({ ...base, ...over });
const ids = (r) => r.map((i) => i.id);

describe("generateInsights", () => {
  it("asks for data when the month is empty", () => {
    expect(run({})).toEqual([{ id: "no-insights", severity: "info", message: "Add some transactions this month to start receiving insights." }]);
  });
  it("says things are steady when there is data but nothing to flag", () => {
    const r = run({ summary: { income: 1000, expenses: 850, balance: 150, savingsRate: 15 }, categoryThisMonth: THIRDS(850) });
    expect(r).toEqual([{ id: "no-insights", severity: "info", message: "Nothing unusual this month. Your spending looks steady." }]);
  });

  describe("budgets", () => {
    it("critical when exceeded, with the overspend amount", () => {
      const r = run({ budgets: [{ category: "Food", amount: 400, spent: 450.5, percentUsed: 112.6, status: "exceeded" }] });
      expect(r[0]).toEqual({ id: "budget-exceeded-Food", severity: "critical", message: "You have exceeded your Food budget by $50.50." });
    });
    it("warning when near the limit", () => {
      const r = run({ budgets: [{ category: "Transport", amount: 150, spent: 135, percentUsed: 90, status: "warning" }] });
      expect(r[0]).toEqual({ id: "budget-warning-Transport", severity: "warning", message: "You have used 90% of your Transport budget." });
    });
    it("silent when ok", () => {
      expect(ids(run({ budgets: [{ category: "X", amount: 100, spent: 10, percentUsed: 10, status: "ok" }] }))).toEqual(["no-insights"]);
    });
  });

  describe("category spikes", () => {
    const spike = (thisTotal, lastTotal) =>
      ids(run({ categoryThisMonth: [{ name: "Dining", total: thisTotal }], categoryLastMonth: [{ name: "Dining", total: lastTotal }], summary: { income: 5000, expenses: 10000, balance: 0, savingsRate: null } }));
    it("flags a 20%+ increase", () => {
      const r = run({ categoryThisMonth: [{ name: "Dining", total: 300 }], categoryLastMonth: [{ name: "Dining", total: 250 }] });
      expect(r.find((i) => i.id === "spike-Dining")).toEqual({ id: "spike-Dining", severity: "warning", message: "You spent 20% more on Dining this month than last month." });
    });
    it("ignores 19% increases", () => expect(spike(238, 200)).not.toContain("spike-Dining"));
    it("flags exactly $20 over at 20%", () => expect(spike(120, 100)).toContain("spike-Dining"));
    it("ignores $19.99 even when ≥ 20%", () => expect(spike(29.99, 10)).not.toContain("spike-Dining"));
    it("ignores categories with no history", () => expect(spike(500, 0)).not.toContain("spike-Dining"));
    it("ignores decreases", () => expect(spike(50, 100)).not.toContain("spike-Dining"));
  });

  describe("dominant category", () => {
    it("flags a category at 40% or more of spending", () => {
      const r = run({
        summary: { income: 2000, expenses: 1000, balance: 1000, savingsRate: 50 },
        categoryThisMonth: [{ name: "Rent", total: 400 }, { name: "Food", total: 300 }, { name: "Misc", total: 300 }],
      });
      expect(r.find((i) => i.id === "top-category")).toEqual({ id: "top-category", severity: "info", message: "Rent is your biggest expense category at $400.00 (40% of spending)." });
    });
    it("does not flag at 39%", () => {
      const r = run({
        summary: { income: 2000, expenses: 1000, balance: 1000, savingsRate: 50 },
        categoryThisMonth: [{ name: "Rent", total: 390 }, { name: "Food", total: 305 }, { name: "Misc", total: 305 }],
      });
      expect(ids(r)).not.toContain("top-category");
    });
    it("on a tie names the first of the tied categories", () => {
      const r = run({
        summary: { income: 5000, expenses: 1000, balance: 4000, savingsRate: 80 },
        categoryThisMonth: [{ name: "First", total: 500 }, { name: "Second", total: 500 }],
      });
      expect(r.find((i) => i.id === "top-category").message).toMatch(/^First /);
    });
    it("picks the largest of several categories", () => {
      const r = run({
        summary: { income: 5000, expenses: 1000, balance: 4000, savingsRate: 80 },
        categoryThisMonth: [{ name: "A", total: 100 }, { name: "B", total: 800 }, { name: "C", total: 100 }],
      });
      expect(r.find((i) => i.id === "top-category").message).toMatch(/^B /);
    });
  });

  describe("month over month", () => {
    const run2 = (expenses, previousExpenses) =>
      ids(run({ summary: { income: 100000, expenses, balance: 0, savingsRate: 50 }, previousExpenses }));
    it("flags +20%", () => expect(run2(1200, 1000)).toContain("expenses-up"));
    it("is a warning", () => {
      const r = run({ summary: { income: 100000, expenses: 1200, balance: 0, savingsRate: 50 }, previousExpenses: 1000 });
      expect(r.find((i) => i.id === "expenses-up").severity).toBe("warning");
    });
    it("message states the percentage", () => {
      const r = run({ summary: { income: 100000, expenses: 1500, balance: 0, savingsRate: 50 }, previousExpenses: 1000 });
      expect(r.find((i) => i.id === "expenses-up").message).toBe("Total spending is up 50% compared with last month.");
    });
    it("ignores +19%", () => expect(run2(1190, 1000)).not.toContain("expenses-up"));
    it("ignores a decrease and a missing previous month", () => {
      expect(run2(800, 1000)).not.toContain("expenses-up");
      expect(run2(800, 0)).not.toContain("expenses-up");
    });
  });

  describe("savings", () => {
    const s = (income, expenses) => ({ income, expenses, balance: income - expenses, savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 1000) / 10 : null });
    it("overspending is critical and states the gap", () => {
      const r = run({ summary: s(1000, 1250) });
      expect(r.find((i) => i.id === "overspending")).toEqual({ id: "overspending", severity: "critical", message: "You have spent $250.00 more than you earned this month." });
    });
    it("spending exactly the income is not overspending but is a low savings rate", () => {
      expect(ids(run({ summary: s(1000, 1000) }))).toEqual(["savings-low"]);
    });
    it("good savings at 20% and above", () => {
      const r = run({ summary: s(1000, 800) });
      expect(r).toEqual([{ id: "savings-good", severity: "positive", message: "You are saving 20% of your income this month." }]);
    });
    it("low savings below 10%", () => {
      expect(run({ summary: s(1000, 910) })).toEqual([{ id: "savings-low", severity: "warning", message: "Your savings rate is only 9% this month." }]);
    });
    it("10% is neither good nor low", () => {
      expect(ids(run({ summary: s(1000, 900), categoryThisMonth: THIRDS(900) }))).toEqual(["no-insights"]);
    });
    it("no income means no savings insight", () => {
      const r = run({ summary: s(0, 100), categoryThisMonth: THIRDS(100) });
      expect(r).toEqual([{ id: "no-insights", severity: "info", message: "Nothing unusual this month. Your spending looks steady." }]);
    });
  });

  it("orders budget alerts before category and savings insights", () => {
    const r = run({
      summary: { income: 1000, expenses: 1300, balance: -300, savingsRate: -30 },
      budgets: [{ category: "Food", amount: 100, spent: 130, percentUsed: 130, status: "exceeded" }],
      categoryThisMonth: [{ name: "Food", total: 130 }, { name: "Rent", total: 1170 }],
      categoryLastMonth: [{ name: "Food", total: 60 }],
      previousExpenses: 900,
    });
    expect(ids(r)).toEqual(["budget-exceeded-Food", "spike-Food", "top-category", "expenses-up", "overspending"]);
  });
});
