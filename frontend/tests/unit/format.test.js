import { describe, it, expect } from "vitest";
import { formatCurrency } from "../../src/utils/format.js";
import { monthLabel, todayLocal, firstOfMonthLocal } from "../../src/utils/dates.js";

describe("formatCurrency", () => {
  it("renders whole dollars with a thousands separator", () => {
    expect(formatCurrency(4250)).toBe("$4,250");
    expect(formatCurrency(0)).toBe("$0");
    expect(formatCurrency(1234567)).toBe("$1,234,567");
  });
  it("renders cents when asked", () => {
    expect(formatCurrency(4250, 2)).toBe("$4,250.00");
    expect(formatCurrency(42.1, 2)).toBe("$42.10");
    expect(formatCurrency(0.5, 2)).toBe("$0.50");
  });
  it("puts the minus sign before the currency symbol", () => {
    expect(formatCurrency(-42.1, 2)).toBe("-$42.10");
    expect(formatCurrency(-1500)).toBe("-$1,500");
  });
  it("never shows a negative zero", () => {
    expect(formatCurrency(-0.001, 2)).toBe("$0.00");
    expect(formatCurrency(-0)).toBe("$0");
  });
  it("rounds to the requested precision", () => {
    expect(formatCurrency(1.006, 2)).toBe("$1.01");
    expect(formatCurrency(2.5)).toBe("$3");
  });
});

describe("date helpers", () => {
  it("monthLabel formats a month key", () => {
    expect(monthLabel("2026-05")).toBe("May 26");
    expect(monthLabel("2025-12")).toBe("Dec 25");
  });
  it("todayLocal is YYYY-MM-DD and firstOfMonthLocal starts the month", () => {
    expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(firstOfMonthLocal()).toBe(`${todayLocal().slice(0, 7)}-01`);
  });
});
