import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeApp, register, resetDb, authed, categoryId, today, startOfMonth, shiftMonths } from "./helpers.js";

const app = makeApp();
let api, ids, token;
const now = today();
const lastMonthDay = shiftMonths(now, -1).slice(0, 8) + "10";

async function add(type, amount, name, date = now) {
  return api.post("/api/transactions", { type, amount, categoryId: ids[name], date, description: name });
}

beforeEach(async () => {
  await resetDb();
  ({ token } = await register(app));
  api = authed(app, token);
  ids = {};
  for (const n of ["Food & Dining", "Transport", "Shopping", "Salary", "Freelance"]) ids[n] = await categoryId(api, n);
});

describe("GET /api/dashboard", () => {
  it("is empty for a new user", async () => {
    const res = await api.get("/api/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      balance: 0, month: { income: 0, expenses: 0, savingsRate: null },
      spendingByCategory: [], recentTransactions: [], budgets: [], hasData: false,
    });
  });

  it("aggregates real data", async () => {
    await add("income", 3000, "Salary");
    await add("expense", 410, "Shopping");
    await add("expense", 340, "Food & Dining");
    await add("expense", 430, "Transport");
    await add("expense", 100, "Food & Dining", lastMonthDay);
    const d = (await api.get("/api/dashboard")).body.data;
    expect(d.balance).toBe(3000 - 410 - 340 - 430 - 100);
    expect(d.month).toEqual({ income: 3000, expenses: 1180, savingsRate: 60.7 });
    expect(d.spendingByCategory.map((c) => [c.name, c.total])).toEqual([["Transport", 430], ["Shopping", 410], ["Food & Dining", 340]]);
    expect(d.spendingByCategory[0].share).toBe(36.4);
    expect(d.hasData).toBe(true);
    expect(d.recentTransactions).toHaveLength(5);
  });

  it("includes active budgets with status", async () => {
    await api.post("/api/budgets", { categoryId: ids["Food & Dining"], amount: 100, period: "monthly", startDate: startOfMonth(now) });
    await api.post("/api/budgets", { categoryId: ids["Transport"], amount: 100, period: "monthly", startDate: shiftMonths(now, -3) });
    await add("expense", 120, "Food & Dining");
    const d = (await api.get("/api/dashboard")).body.data;
    expect(d.budgets).toHaveLength(1);
    expect(d.budgets[0]).toMatchObject({ category: "Food & Dining", spent: 120, exceeded: true, status: "exceeded" });
  });

  it("only shows the caller's data", async () => {
    await add("income", 100, "Salary");
    const other = authed(app, (await register(app)).token);
    expect((await other.get("/api/dashboard")).body.data.hasData).toBe(false);
  });
});

describe("GET /api/analytics", () => {
  it("returns a zero-filled monthly series of the requested length", async () => {
    await add("income", 1000, "Salary");
    await add("expense", 400, "Food & Dining");
    await add("expense", 50, "Food & Dining", lastMonthDay);
    const res = await api.get("/api/analytics?months=3");
    expect(res.status).toBe(200);
    const a = res.body.data;
    expect(a.range.months).toBe(3);
    expect(a.monthly).toHaveLength(3);
    expect(a.monthly[0]).toEqual({ month: shiftMonths(now, -2).slice(0, 7), income: 0, expenses: 0, net: 0 });
    expect(a.monthly[1]).toEqual({ month: shiftMonths(now, -1).slice(0, 7), income: 0, expenses: 50, net: -50 });
    expect(a.monthly[2]).toEqual({ month: now.slice(0, 7), income: 1000, expenses: 400, net: 600 });
    expect(a.summary).toEqual({ income: 1000, expenses: 450, balance: 550, savingsRate: 55 });
    expect(a.spendingByCategory).toEqual([{ categoryId: ids["Food & Dining"], name: "Food & Dining", total: 450, share: 100 }]);
  });

  it("excludes transactions outside the window", async () => {
    await add("expense", 70, "Transport", shiftMonths(now, -5).slice(0, 8) + "15");
    const a = (await api.get("/api/analytics?months=2")).body.data;
    expect(a.summary.expenses).toBe(0);
    expect(a.spendingByCategory).toEqual([]);
    expect((await api.get("/api/analytics?months=6")).body.data.summary.expenses).toBe(70);
  });

  it("provides daily spending for the last 30 days", async () => {
    await add("expense", 10, "Transport");
    await add("expense", 5, "Food & Dining");
    const a = (await api.get("/api/analytics")).body.data;
    expect(a.dailySpending).toEqual([{ date: now, total: 15 }]);
    expect(a.monthly).toHaveLength(6);
  });

  it("validates months", async () => {
    expect((await api.get("/api/analytics?months=0")).status).toBe(400);
    expect((await api.get("/api/analytics?months=25")).status).toBe(400);
  });
});

describe("GET /api/insights", () => {
  it("falls back to the rule-based engine without an AI provider", async () => {
    const res = await api.get("/api/insights");
    expect(res.status).toBe(200);
    expect(res.body.data.source).toBe("rule-based");
    expect(res.body.data.insights[0].id).toBe("no-insights");
  });

  it("derives insights from real data", async () => {
    await api.post("/api/budgets", { categoryId: ids["Food & Dining"], amount: 100, period: "monthly", startDate: startOfMonth(now) });
    await add("income", 1000, "Salary");
    await add("expense", 130, "Food & Dining");
    await add("expense", 1100, "Shopping");
    const { insights } = (await api.get("/api/insights")).body.data;
    const found = insights.map((i) => i.id);
    expect(found).toContain("budget-exceeded-Food & Dining");
    expect(found).toContain("overspending");
    expect(found).toContain("top-category");
    expect(insights.find((i) => i.id === "budget-exceeded-Food & Dining").severity).toBe("critical");
  });

  it("uses the AI provider when it answers", async () => {
    const ai = vi.fn().mockResolvedValue([{ id: "ai-0", severity: "info", message: "Hello from the model" }]);
    const aiApp = makeApp({ ai });
    await add("income", 1000, "Salary");
    const res = await authed(aiApp, token).get("/api/insights");
    expect(res.body.data).toEqual({ source: "ai", insights: [{ id: "ai-0", severity: "info", message: "Hello from the model" }] });
    const sent = ai.mock.calls[0][0];
    expect(sent).toHaveProperty("thisMonth");
    expect(JSON.stringify(sent)).not.toMatch(/@|password|email/i);
  });

  it("falls back to rules when the AI provider fails or returns nothing", async () => {
    const { token } = await register(app);
    for (const ai of [vi.fn().mockRejectedValue(new Error("down")), vi.fn().mockResolvedValue(null), vi.fn().mockResolvedValue([])]) {
      const res = await authed(makeApp({ ai }), token).get("/api/insights");
      expect(res.status).toBe(200);
      expect(res.body.data.source).toBe("rule-based");
    }
  });
});
