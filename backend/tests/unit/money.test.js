import { describe, it, expect } from "vitest";
import { round2 } from "../../src/utils/money.js";

describe("round2", () => {
  it("rounds to cents", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.344)).toBe(2.34);
    expect(round2(2.345)).toBe(2.35);
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(-1.555)).toBe(-1.55);
    expect(round2(10)).toBe(10);
    expect(round2(0)).toBe(0);
  });
});
