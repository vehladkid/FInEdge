import { describe, it, expect, beforeEach } from "vitest";
import { makeApp, register, resetDb, authed, categoryId, today, startOfMonth, shiftMonths, addDays } from "./helpers.js";

const app = makeApp();
let api, food, salary;
const monthStart = startOfMonth(today());

const budget = (over = {}) => ({ categoryId: food, amount: 400, period: "monthly", startDate: monthStart, ...over });
const spend = (amount, over = {}) => api.post("/api/transactions", { type: "expense", amount, categoryId: food, date: today(), description: "", ...over });

beforeEach(async () => {
  await resetDb();
  api = authed(app, (await register(app)).token);
  food = await categoryId(api, "Food & Dining");
  salary = await categoryId(api, "Salary");
});

describe("budgets CRUD", () => {
  it("creates a budget with a computed end date and zero spend", async () => {
    const res = await api.post("/api/budgets", budget());
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      categoryId: food, category: "Food & Dining", amount: 400, period: "monthly", startDate: monthStart,
      spent: 0, remaining: 400, percentUsed: 0, exceeded: false, status: "ok",
    });
    expect(res.body.data.endDate >= today()).toBe(true);
  });

  it("lists, reads, updates and deletes", async () => {
    const { id } = (await api.post("/api/budgets", budget())).body.data;
    expect((await api.get("/api/budgets")).body.data).toHaveLength(1);
    expect((await api.get(`/api/budgets/${id}`)).body.data.id).toBe(id);

    const up = await api.put(`/api/budgets/${id}`, { amount: 250, period: "weekly", startDate: "2026-05-04" });
    expect(up.status).toBe(200);
    expect(up.body.data).toMatchObject({ amount: 250, period: "weekly", startDate: "2026-05-04", endDate: "2026-05-10" });

    expect((await api.delete(`/api/budgets/${id}`)).status).toBe(204);
    expect((await api.get(`/api/budgets/${id}`)).status).toBe(404);
    expect((await api.delete(`/api/budgets/${id}`)).status).toBe(404);
    expect((await api.put(`/api/budgets/${id}`, { amount: 1, period: "weekly", startDate: "2026-05-04" })).status).toBe(404);
  });

  it("rejects bad input", async () => {
    expect((await api.post("/api/budgets", budget({ amount: 0 }))).status).toBe(400);
    expect((await api.post("/api/budgets", budget({ period: "daily" }))).status).toBe(400);
    expect((await api.post("/api/budgets", budget({ startDate: "nope" }))).status).toBe(400);
    expect((await api.post("/api/budgets", budget({ categoryId: 99999 }))).body.error.message).toBe("Category does not exist");
    const income = await api.post("/api/budgets", budget({ categoryId: salary }));
    expect(income.status).toBe(400);
    expect(income.body.error.message).toBe("Budgets can only be set on expense categories");
  });

  it("rejects a duplicate budget for the same category, period and start", async () => {
    await api.post("/api/budgets", budget());
    const dup = await api.post("/api/budgets", budget({ amount: 10 }));
    expect(dup.status).toBe(409);
    expect((await api.post("/api/budgets", budget({ period: "weekly" }))).status).toBe(201);
  });

  it("rejects an update that collides with another budget", async () => {
    await api.post("/api/budgets", budget());
    const other = (await api.post("/api/budgets", budget({ period: "weekly" }))).body.data;
    const res = await api.put(`/api/budgets/${other.id}`, { amount: 5, period: "monthly", startDate: monthStart });
    expect(res.status).toBe(409);
  });
});

describe("budget calculations come from real transactions", () => {
  it("reports spent, remaining and percentage", async () => {
    const { id } = (await api.post("/api/budgets", budget())).body.data;
    await spend(100);
    await spend(140.5);
    const b = (await api.get(`/api/budgets/${id}`)).body.data;
    expect(b).toMatchObject({ spent: 240.5, remaining: 159.5, percentUsed: 60.1, exceeded: false, status: "ok" });
  });

  it("warns at 80% and treats exactly-at-budget as not exceeded", async () => {
    const { id } = (await api.post("/api/budgets", budget())).body.data;
    await spend(320);
    expect((await api.get(`/api/budgets/${id}`)).body.data).toMatchObject({ percentUsed: 80, status: "warning" });
    await spend(80);
    expect((await api.get(`/api/budgets/${id}`)).body.data).toMatchObject({ spent: 400, remaining: 0, percentUsed: 100, exceeded: false, status: "warning" });
  });

  it("flags an exceeded budget", async () => {
    const { id } = (await api.post("/api/budgets", budget())).body.data;
    await spend(450);
    expect((await api.get(`/api/budgets/${id}`)).body.data).toMatchObject({ spent: 450, remaining: -50, percentUsed: 112.5, exceeded: true, status: "exceeded" });
  });

  it("only counts expenses in this category inside the period", async () => {
    const transport = await categoryId(api, "Transport");
    const { id } = (await api.post("/api/budgets", budget({ period: "weekly", startDate: addDays(today(), -3) }))).body.data;
    await spend(10); // in range
    await spend(7, { date: addDays(today(), -3) }); // first day, inclusive
    await spend(5, { date: addDays(today(), -4) }); // before start
    await spend(9, { date: addDays(today(), 4) }); // after end (start+6)
    await spend(3, { categoryId: transport }); // other category
    await api.post("/api/transactions", { type: "income", amount: 500, categoryId: salary, date: today() });
    expect((await api.get(`/api/budgets/${id}`)).body.data.spent).toBe(17);
  });

  it("includes the last day of the period", async () => {
    const start = addDays(today(), -6);
    const { id } = (await api.post("/api/budgets", budget({ period: "weekly", startDate: start }))).body.data;
    await spend(8, { date: today() }); // = end date
    expect((await api.get(`/api/budgets/${id}`)).body.data.spent).toBe(8);
  });

  it("reflects edits and deletions of transactions immediately", async () => {
    const { id } = (await api.post("/api/budgets", budget())).body.data;
    const t = (await spend(100)).body.data;
    await api.put(`/api/transactions/${t.id}`, { type: "expense", amount: 150, categoryId: food, date: today(), description: "" });
    expect((await api.get(`/api/budgets/${id}`)).body.data.spent).toBe(150);
    await api.delete(`/api/transactions/${t.id}`);
    expect((await api.get(`/api/budgets/${id}`)).body.data.spent).toBe(0);
  });

  it("does not count another user's spending", async () => {
    const { id } = (await api.post("/api/budgets", budget())).body.data;
    const other = authed(app, (await register(app)).token);
    const otherFood = await categoryId(other, "Food & Dining");
    await other.post("/api/transactions", { type: "expense", amount: 999, categoryId: otherFood, date: today() });
    expect((await api.get(`/api/budgets/${id}`)).body.data.spent).toBe(0);
  });
});

describe("budget isolation", () => {
  it("hides, rejects edits and deletes of another user's budget", async () => {
    const { id } = (await api.post("/api/budgets", budget())).body.data;
    const other = authed(app, (await register(app)).token);
    expect((await other.get("/api/budgets")).body.data).toEqual([]);
    expect((await other.get(`/api/budgets/${id}`)).status).toBe(404);
    expect((await other.put(`/api/budgets/${id}`, { amount: 1, period: "monthly", startDate: monthStart })).status).toBe(404);
    expect((await other.delete(`/api/budgets/${id}`)).status).toBe(404);
    expect((await other.post("/api/budgets", budget())).status).toBe(400); // not their category
    expect((await api.get(`/api/budgets/${id}`)).body.data.amount).toBe(400);
  });

  it("lists newest period first", async () => {
    await api.post("/api/budgets", budget({ startDate: shiftMonths(today(), -1) }));
    await api.post("/api/budgets", budget());
    const list = (await api.get("/api/budgets")).body.data;
    expect(list.map((b) => b.startDate)).toEqual([monthStart, shiftMonths(today(), -1)]);
  });
});
