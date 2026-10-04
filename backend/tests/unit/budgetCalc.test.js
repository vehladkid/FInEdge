import { describe, it, expect } from "vitest";
import { budgetStatus, WARNING_THRESHOLD } from "../../src/services/budgetCalc.js";

describe("budgetStatus", () => {
  it("nothing spent", () => {
    expect(budgetStatus(400, 0)).toEqual({ spent: 0, remaining: 400, percentUsed: 0, exceeded: false, status: "ok" });
  });
  it("under the warning threshold", () => {
    expect(budgetStatus(400, 100)).toEqual({ spent: 100, remaining: 300, percentUsed: 25, exceeded: false, status: "ok" });
  });
  it("just below the warning threshold stays ok", () => {
    expect(WARNING_THRESHOLD).toBe(80);
    expect(budgetStatus(1000, 799).status).toBe("ok");
  });
  it("exactly the warning threshold is a warning", () => {
    expect(budgetStatus(1000, 800)).toMatchObject({ percentUsed: 80, status: "warning", exceeded: false });
  });
  it("exactly at budget is 100% but not exceeded", () => {
    expect(budgetStatus(400, 400)).toEqual({ spent: 400, remaining: 0, percentUsed: 100, exceeded: false, status: "warning" });
  });
  it("one cent over is exceeded with negative remaining", () => {
    expect(budgetStatus(400, 400.01)).toEqual({ spent: 400.01, remaining: -0.01, percentUsed: 100, exceeded: true, status: "exceeded" });
  });
  it("well over budget", () => {
    expect(budgetStatus(150, 180)).toEqual({ spent: 180, remaining: -30, percentUsed: 120, exceeded: true, status: "exceeded" });
  });
  it("percent has one decimal place", () => {
    expect(budgetStatus(300, 100).percentUsed).toBe(33.3);
    expect(budgetStatus(300, 200).percentUsed).toBe(66.7);
  });
  it("rounds floating point noise", () => {
    expect(budgetStatus(10, 0.1 + 0.2)).toMatchObject({ spent: 0.3, remaining: 9.7 });
  });
  it("a zero allocation never divides by zero", () => {
    expect(budgetStatus(0, 0)).toMatchObject({ percentUsed: 0, exceeded: false, status: "ok" });
    expect(budgetStatus(0, 5)).toMatchObject({ percentUsed: 0, exceeded: true, status: "exceeded" });
  });
});
