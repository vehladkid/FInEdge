import { describe, it, expect, beforeEach } from "vitest";
import { makeApp, register, resetDb, authed, categoryId } from "./helpers.js";

const app = makeApp();
let api, food, salary, token;

beforeEach(async () => {
  await resetDb();
  ({ token } = await register(app));
  api = authed(app, token);
  food = await categoryId(api, "Food & Dining");
  salary = await categoryId(api, "Salary");
});

const tx = (over = {}) => ({ type: "expense", amount: 12.5, categoryId: food, description: "lunch", date: "2026-05-04", ...over });

describe("transactions CRUD", () => {
  it("creates and returns a transaction with its category name", async () => {
    const res = await api.post("/api/transactions", tx());
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ type: "expense", amount: 12.5, description: "lunch", date: "2026-05-04", categoryId: food, categoryName: "Food & Dining" });
    expect(res.body.data.id).toEqual(expect.any(Number));
  });

  it("reads one and lists many (newest first)", async () => {
    const a = (await api.post("/api/transactions", tx({ date: "2026-05-01" }))).body.data;
    const b = (await api.post("/api/transactions", tx({ date: "2026-05-09" }))).body.data;
    expect((await api.get(`/api/transactions/${a.id}`)).body.data.id).toBe(a.id);
    const list = await api.get("/api/transactions");
    expect(list.body.data.map((t) => t.id)).toEqual([b.id, a.id]);
    expect(list.body.meta).toEqual({ page: 1, limit: 20, total: 2, pages: 1 });
  });

  it("updates a transaction", async () => {
    const { id } = (await api.post("/api/transactions", tx())).body.data;
    const res = await api.put(`/api/transactions/${id}`, tx({ amount: 99.99, description: "dinner" }));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id, amount: 99.99, description: "dinner" });
    expect((await api.get(`/api/transactions/${id}`)).body.data.amount).toBe(99.99);
  });

  it("deletes a transaction", async () => {
    const { id } = (await api.post("/api/transactions", tx())).body.data;
    expect((await api.delete(`/api/transactions/${id}`)).status).toBe(204);
    expect((await api.get(`/api/transactions/${id}`)).status).toBe(404);
    expect((await api.delete(`/api/transactions/${id}`)).status).toBe(404);
  });

  it("404s for an unknown id on get and update", async () => {
    expect((await api.get("/api/transactions/9999")).status).toBe(404);
    expect((await api.put("/api/transactions/9999", tx())).status).toBe(404);
  });
});

describe("validation", () => {
  it.each([
    [{ amount: 0 }, "Amount must be greater than 0"],
    [{ amount: -1 }, "Amount must be greater than 0"],
    [{ amount: "12" }, "Amount must be a number"],
    [{ type: "transfer" }, "Type must be income or expense"],
    [{ date: "2026-02-30" }, "Date must be a valid YYYY-MM-DD date"],
    [{ description: "x".repeat(201) }, "Description is too long"],
  ])("rejects %j", async (over, message) => {
    const res = await api.post("/api/transactions", tx(over));
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe(message);
  });

  it("rejects an unknown category and a category of the wrong type", async () => {
    const unknown = await api.post("/api/transactions", tx({ categoryId: 99999 }));
    expect(unknown.status).toBe(400);
    expect(unknown.body.error.message).toBe("Category does not exist");
    const wrong = await api.post("/api/transactions", tx({ categoryId: salary }));
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.message).toMatch(/is an income category/);
  });

  it("validates id parameters and query parameters", async () => {
    expect((await api.get("/api/transactions/abc")).status).toBe(400);
    expect((await api.get("/api/transactions?page=0")).status).toBe(400);
    expect((await api.get("/api/transactions?from=2026-02-01&to=2026-01-01")).status).toBe(400);
  });

  it("validates updates the same way", async () => {
    const { id } = (await api.post("/api/transactions", tx())).body.data;
    expect((await api.put(`/api/transactions/${id}`, tx({ amount: 0 }))).status).toBe(400);
    expect((await api.put(`/api/transactions/${id}`, tx({ categoryId: salary }))).status).toBe(400);
  });
});

describe("filtering and pagination", () => {
  beforeEach(async () => {
    const transport = await categoryId(api, "Transport");
    await api.post("/api/transactions", tx({ date: "2026-04-30", amount: 1 }));
    await api.post("/api/transactions", tx({ date: "2026-05-01", amount: 2 }));
    await api.post("/api/transactions", tx({ date: "2026-05-15", amount: 3, categoryId: transport }));
    await api.post("/api/transactions", { type: "income", amount: 1000, categoryId: salary, description: "pay", date: "2026-05-02" });
  });

  it("filters by type", async () => {
    const res = await api.get("/api/transactions?type=income");
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].amount).toBe(1000);
  });
  it("filters by category", async () => {
    const res = await api.get(`/api/transactions?categoryId=${food}`);
    expect(res.body.data.map((t) => t.amount).sort()).toEqual([1, 2]);
  });
  it("filters by inclusive date range", async () => {
    const res = await api.get("/api/transactions?from=2026-05-01&to=2026-05-02");
    expect(res.body.data.map((t) => t.amount).sort((a, b) => a - b)).toEqual([2, 1000]);
  });
  it("combines filters", async () => {
    const res = await api.get(`/api/transactions?type=expense&from=2026-05-01&categoryId=${food}`);
    expect(res.body.data.map((t) => t.amount)).toEqual([2]);
  });
  it("paginates and reports totals", async () => {
    const p1 = await api.get("/api/transactions?limit=3&page=1");
    const p2 = await api.get("/api/transactions?limit=3&page=2");
    expect(p1.body.data).toHaveLength(3);
    expect(p2.body.data).toHaveLength(1);
    expect(p1.body.meta).toEqual({ page: 1, limit: 3, total: 4, pages: 2 });
    const ids = [...p1.body.data, ...p2.body.data].map((t) => t.id);
    expect(new Set(ids).size).toBe(4);
  });
  it("returns an empty page beyond the end", async () => {
    const res = await api.get("/api/transactions?page=9");
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(4);
  });
});

describe("data isolation between users", () => {
  it("never exposes, edits or deletes another user's transactions", async () => {
    const { id } = (await api.post("/api/transactions", tx())).body.data;
    const other = authed(app, (await register(app)).token);

    expect((await other.get("/api/transactions")).body.data).toEqual([]);
    expect((await other.get(`/api/transactions/${id}`)).status).toBe(404);
    const otherFood = await categoryId(other, "Food & Dining");
    expect((await other.put(`/api/transactions/${id}`, tx({ categoryId: otherFood }))).status).toBe(404);
    expect((await other.delete(`/api/transactions/${id}`)).status).toBe(404);
    // still intact for the owner
    expect((await api.get(`/api/transactions/${id}`)).body.data.amount).toBe(12.5);
  });

  it("refuses to use another user's category", async () => {
    const other = authed(app, (await register(app)).token);
    const otherFood = await categoryId(other, "Food & Dining");
    const res = await api.post("/api/transactions", tx({ categoryId: otherFood }));
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Category does not exist");
  });
});
