import { describe, it, expect } from "vitest";
import { addDays, endOfMonth, endOfPeriod, isValidIsoDate, shiftMonths, startOfMonth, toIso } from "../../src/utils/dates.js";

describe("isValidIsoDate", () => {
  it.each(["2026-01-01", "2024-02-29", "2026-12-31", "0050-01-01"])("accepts %s", (d) => expect(isValidIsoDate(d)).toBe(true));
  it.each([
    "2026-02-30", "2025-02-29", "2026-13-01", "2026-00-10", "2026-01-00", "2026-1-1", "26-01-01",
    "2026-01-01T00:00:00Z", " 2026-01-01", "2026-01-011", "", "not a date",
  ])("rejects %j", (d) => expect(isValidIsoDate(d)).toBe(false));
  it("rejects non-strings, even ones that stringify to a date", () => {
    for (const v of [null, undefined, 20260101, new Date(), { toString: () => "2026-01-01" }]) expect(isValidIsoDate(v)).toBe(false);
  });
});

describe("date arithmetic", () => {
  it("toIso formats UTC date", () => expect(toIso(new Date("2026-03-05T23:59:59Z"))).toBe("2026-03-05"));
  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
    expect(addDays("2026-05-10", 0)).toBe("2026-05-10");
  });
  it("startOfMonth / endOfMonth", () => {
    expect(startOfMonth("2026-05-17")).toBe("2026-05-01");
    expect(endOfMonth("2026-05-17")).toBe("2026-05-31");
    expect(endOfMonth("2026-02-01")).toBe("2026-02-28");
    expect(endOfMonth("2024-02-10")).toBe("2024-02-29");
    expect(endOfMonth("2026-04-30")).toBe("2026-04-30");
    expect(endOfMonth("2026-12-05")).toBe("2026-12-31");
  });
  it("shiftMonths returns the first of the shifted month", () => {
    expect(shiftMonths("2026-03-15", -1)).toBe("2026-02-01");
    expect(shiftMonths("2026-01-31", -1)).toBe("2025-12-01");
    expect(shiftMonths("2026-11-20", 3)).toBe("2027-02-01");
    expect(shiftMonths("2026-03-15", 0)).toBe("2026-03-01");
    expect(shiftMonths("2026-03-31", -13)).toBe("2025-02-01");
  });
});

describe("endOfPeriod", () => {
  it("weekly covers 7 days inclusive", () => {
    expect(endOfPeriod("weekly", "2026-05-04")).toBe("2026-05-10");
    expect(endOfPeriod("weekly", "2026-12-28")).toBe("2027-01-03");
  });
  it("monthly ends the day before the same day next month", () => {
    expect(endOfPeriod("monthly", "2026-05-01")).toBe("2026-05-31");
    expect(endOfPeriod("monthly", "2026-05-15")).toBe("2026-06-14");
    expect(endOfPeriod("monthly", "2026-12-01")).toBe("2026-12-31");
    expect(endOfPeriod("monthly", "2026-12-15")).toBe("2027-01-14");
    expect(endOfPeriod("monthly", "2026-02-01")).toBe("2026-02-28");
  });
  it("monthly clamps when the next month is shorter", () => {
    expect(endOfPeriod("monthly", "2026-01-31")).toBe("2026-02-27");
    expect(endOfPeriod("monthly", "2026-01-30")).toBe("2026-02-27");
    expect(endOfPeriod("monthly", "2026-03-31")).toBe("2026-04-29");
  });
  it("yearly ends the day before the next anniversary", () => {
    expect(endOfPeriod("yearly", "2026-01-01")).toBe("2026-12-31");
    expect(endOfPeriod("yearly", "2026-06-15")).toBe("2027-06-14");
    expect(endOfPeriod("yearly", "2024-02-29")).toBe("2025-02-27");
    expect(endOfPeriod("yearly", "2023-02-28")).toBe("2024-02-27");
  });
  it("rejects unknown periods", () => {
    expect(() => endOfPeriod("daily", "2026-01-01")).toThrow("Unknown budget period: daily");
  });
});
