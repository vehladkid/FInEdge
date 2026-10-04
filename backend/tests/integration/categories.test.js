import { describe, it, expect, beforeEach } from "vitest";
import { makeApp, register, resetDb, authed, categoryId } from "./helpers.js";

const app = makeApp();
let api;
beforeEach(async () => {
  await resetDb();
  api = authed(app, (await register(app)).token);
});

describe("categories", () => {
  it("lists categories and filters by type", async () => {
    const all = await api.get("/api/categories");
    const income = await api.get("/api/categories?type=income");
    expect(all.body.data).toHaveLength(9);
    expect(income.body.data.map((c) => c.name).sort()).toEqual(["Freelance", "Other Income", "Salary"]);
    expect(income.body.data.every((c) => c.type === "income")).toBe(true);
    const ignoredBadFilter = await api.get("/api/categories?type=bogus");
    expect(ignoredBadFilter.body.data).toHaveLength(9);
  });

  it("creates a category", async () => {
    const res = await api.post("/api/categories", { name: "  Rent ", type: "expense" });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: "Rent", type: "expense" });
  });

  it("rejects duplicates and invalid input", async () => {
    expect((await api.post("/api/categories", { name: "Transport", type: "expense" })).status).toBe(409);
    expect((await api.post("/api/categories", { name: "Transport", type: "income" })).status).toBe(201);
    expect((await api.post("/api/categories", { name: "", type: "expense" })).status).toBe(400);
    expect((await api.post("/api/categories", { name: "X", type: "nope" })).status).toBe(400);
  });

  it("renames a category", async () => {
    const id = await categoryId(api, "Shopping");
    const res = await api.put(`/api/categories/${id}`, { name: "Retail" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Retail");
  });

  it("rejects renaming to an existing name and renaming a missing category", async () => {
    const id = await categoryId(api, "Shopping");
    expect((await api.put(`/api/categories/${id}`, { name: "Transport" })).status).toBe(409);
    expect((await api.put("/api/categories/99999", { name: "Zzz" })).status).toBe(404);
  });

  it("deletes an unused category", async () => {
    const id = await categoryId(api, "Other");
    expect((await api.delete(`/api/categories/${id}`)).status).toBe(204);
    expect((await api.get("/api/categories")).body.data.find((c) => c.id === id)).toBeUndefined();
    expect((await api.delete(`/api/categories/${id}`)).status).toBe(404);
  });

  it("refuses to delete a category used by transactions, then allows it once they are gone", async () => {
    const food = await categoryId(api, "Food & Dining");
    const t = (await api.post("/api/transactions", { type: "expense", amount: 5, categoryId: food, date: "2026-05-01" })).body.data;
    const blocked = await api.delete(`/api/categories/${food}`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.message).toBe("Category is used by 1 transaction and cannot be deleted");
    await api.post("/api/transactions", { type: "expense", amount: 6, categoryId: food, date: "2026-05-02" });
    expect((await api.delete(`/api/categories/${food}`)).body.error.message).toBe("Category is used by 2 transactions and cannot be deleted");
    await api.delete(`/api/transactions/${t.id}`);
    const rows = (await api.get("/api/transactions")).body.data;
    await api.delete(`/api/transactions/${rows[0].id}`);
    expect((await api.delete(`/api/categories/${food}`)).status).toBe(204);
  });

  it("deleting a category removes its budgets", async () => {
    const id = await categoryId(api, "Utilities");
    await api.post("/api/budgets", { categoryId: id, amount: 100, period: "monthly", startDate: "2026-05-01" });
    await api.delete(`/api/categories/${id}`);
    expect((await api.get("/api/budgets")).body.data).toEqual([]);
  });

  it("isolates categories between users", async () => {
    const mine = await categoryId(api, "Shopping");
    const other = authed(app, (await register(app)).token);
    expect((await other.put(`/api/categories/${mine}`, { name: "Hacked" })).status).toBe(404);
    expect((await other.delete(`/api/categories/${mine}`)).status).toBe(404);
    expect((await api.get("/api/categories")).body.data.find((c) => c.id === mine).name).toBe("Shopping");
  });
});
