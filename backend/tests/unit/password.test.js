import { describe, it, expect } from "vitest";
import { passwordProblems, PASSWORD_MAX, PASSWORD_MIN } from "../../src/utils/password.js";

describe("passwordProblems", () => {
  it("has the documented limits", () => {
    expect(PASSWORD_MIN).toBe(8);
    expect(PASSWORD_MAX).toBe(72);
  });
  it("accepts a valid password", () => expect(passwordProblems("abcdefg1")).toEqual([]));
  it("accepts exactly the minimum and maximum length", () => {
    expect(passwordProblems("a1".repeat(4))).toEqual([]);
    expect(passwordProblems("a1".repeat(36))).toEqual([]);
  });
  it("rejects one character under the minimum", () => {
    expect(passwordProblems("abcdef1")).toEqual(["Password must be at least 8 characters"]);
  });
  it("rejects one character over the maximum", () => {
    expect(passwordProblems(`${"a1".repeat(36)}x`)).toEqual(["Password must be at most 72 characters"]);
  });
  it("requires a letter", () => expect(passwordProblems("12345678")).toEqual(["Password must contain a letter"]));
  it("requires a digit", () => expect(passwordProblems("abcdefgh")).toEqual(["Password must contain a digit"]));
  it("accepts uppercase-only letters", () => expect(passwordProblems("ABCDEFG1")).toEqual([]));
  it("reports every problem at once", () => {
    expect(passwordProblems("!")).toEqual([
      "Password must be at least 8 characters",
      "Password must contain a letter",
      "Password must contain a digit",
    ]);
  });
  it("rejects non-strings", () => {
    for (const v of [undefined, null, 12345678]) expect(passwordProblems(v)).toEqual(["Password is required"]);
  });
});
