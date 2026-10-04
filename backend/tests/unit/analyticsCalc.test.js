import { describe, it, expect } from "vitest";
import { monthKeys, monthlySeries, summarize, withShares } from "../../src/services/analyticsCalc.js";

describe("summarize", () => {
  it("empty list is all zeros with no savings rate", () => {
    expect(summarize([])).toEqual({ income: 0, expenses: 0, balance: 0, savingsRate: null });
  });
  it("income and expenses", () => {
    expect(summarize([{ type: "income", total: 3000 }, { type: "expense", total: 1180 }])).toEqual({
      income: 3000, expenses: 1180, balance: 1820, savingsRate: 60.7,
    });
  });
  it("zero income yields negative balance and null rate", () => {
    expect(summarize([{ type: "expense", total: 50 }])).toEqual({ income: 0, expenses: 50, balance: -50, savingsRate: null });
  });
  it("zero expenses is a 100% savings rate", () => {
    expect(summarize([{ type: "income", total: 200 }])).toMatchObject({ balance: 200, savingsRate: 100 });
  });
  it("expenses above income give a negative rate", () => {
    expect(summarize([{ type: "income", total: 100 }, { type: "expense", total: 150 }])).toMatchObject({
      balance: -50, savingsRate: -50,
    });
  });
  it("sums several rows of the same type and ignores unknown types", () => {
    expect(
      summarize([
        { type: "income", total: 10.1 }, { type: "income", total: 20.2 },
        { type: "expense", total: 0.1 }, { type: "expense", total: 0.2 }, { type: "transfer", total: 999 },
      ])
    ).toMatchObject({ income: 30.3, expenses: 0.3, balance: 30 });
  });
});

describe("monthKeys", () => {
  it("returns the last N months oldest first", () => {
    expect(monthKeys("2026-03-15", 3)).toEqual(["2026-01", "2026-02", "2026-03"]);
  });
  it("crosses the year boundary", () => {
    expect(monthKeys("2026-02-10", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
  it("a single month is the current one", () => expect(monthKeys("2026-07-31", 1)).toEqual(["2026-07"]));
});

describe("monthlySeries", () => {
  const rows = [
    { month: "2026-01", type: "income", total: 1000 },
    { month: "2026-01", type: "expense", total: 400.5 },
    { month: "2026-03", type: "expense", total: 100 },
    { month: "2025-12", type: "expense", total: 777 },
  ];
  it("zero-fills months and ignores rows outside the window", () => {
    expect(monthlySeries(rows, "2026-03-20", 3)).toEqual([
      { month: "2026-01", income: 1000, expenses: 400.5, net: 599.5 },
      { month: "2026-02", income: 0, expenses: 0, net: 0 },
      { month: "2026-03", income: 0, expenses: 100, net: -100 },
    ]);
  });
  it("adds several rows of one month and type", () => {
    const out = monthlySeries([{ month: "2026-03", type: "income", total: 1 }, { month: "2026-03", type: "income", total: 2 }], "2026-03-01", 1);
    expect(out).toEqual([{ month: "2026-03", income: 3, expenses: 0, net: 3 }]);
  });
});

describe("withShares", () => {
  it("computes percentage of total with one decimal", () => {
    expect(withShares([{ name: "A", total: 1 }, { name: "B", total: 2 }])).toEqual([
      { name: "A", total: 1, share: 33.3 },
      { name: "B", total: 2, share: 66.7 },
    ]);
  });
  it("empty input and zero totals", () => {
    expect(withShares([])).toEqual([]);
    expect(withShares([{ name: "A", total: 0 }])).toEqual([{ name: "A", total: 0, share: 0 }]);
  });
  it("keeps extra fields and rounds totals to cents", () => {
    expect(withShares([{ categoryId: 7, name: "Food", total: 10.004 }])).toEqual([
      { categoryId: 7, name: "Food", total: 10, share: 100 },
    ]);
  });
});
