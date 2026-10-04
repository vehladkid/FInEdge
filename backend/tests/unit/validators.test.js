import { describe, it, expect } from "vitest";
import * as v from "../../src/validators/index.js";

const fails = (schema, data) => {
  try {
    v.parse(schema, data);
  } catch (e) {
    return e;
  }
  throw new Error("expected validation to fail");
};

describe("parse", () => {
  it("returns parsed data", () => {
    expect(v.parse(v.loginSchema, { email: " A@B.com ", password: "x" })).toEqual({ email: "a@b.com", password: "x" });
  });
  it("throws a 400 VALIDATION_ERROR with field details", () => {
    const e = fails(v.loginSchema, { email: "" });
    expect(e).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(e.details).toEqual(expect.arrayContaining([{ field: "password", message: "Password is required" }]));
    expect(e.message).toBe(e.details[0].message);
  });
  it("treats an undefined body as empty", () => {
    expect(fails(v.loginSchema, undefined).code).toBe("VALIDATION_ERROR");
  });
});

describe("registerSchema", () => {
  const ok = { name: "  Ada  ", email: "Ada@Example.COM", password: "secret123" };
  it("trims the name and lowercases the email", () => {
    expect(v.parse(v.registerSchema, ok)).toEqual({ name: "Ada", email: "ada@example.com", password: "secret123" });
  });
  it("trims whitespace around the email", () => {
    expect(v.parse(v.registerSchema, { ...ok, email: "  ada@example.com  " }).email).toBe("ada@example.com");
  });
  it("requires a name", () => {
    expect(fails(v.registerSchema, { ...ok, name: "   " }).message).toBe("Name is required");
    expect(fails(v.registerSchema, { ...ok, name: undefined }).message).toBe("Name is required");
  });
  it("limits name to 100 characters", () => {
    expect(v.parse(v.registerSchema, { ...ok, name: "a".repeat(100) }).name).toHaveLength(100);
    expect(fails(v.registerSchema, { ...ok, name: "a".repeat(101) }).message).toBe("Name is too long");
  });
  it("rejects malformed and missing emails", () => {
    expect(fails(v.registerSchema, { ...ok, email: "nope" }).message).toBe("Email is invalid");
    expect(fails(v.registerSchema, { ...ok, email: "a@b" }).message).toBe("Email is invalid");
    expect(fails(v.registerSchema, { ...ok, email: undefined }).message).toBe("Email is required");
  });
  it("rejects an over-long email", () => {
    expect(fails(v.registerSchema, { ...ok, email: `${"a".repeat(250)}@x.com` }).message).toBe("Email is too long");
  });
  it("applies the password policy", () => {
    expect(fails(v.registerSchema, { ...ok, password: "short1" }).message).toMatch(/at least 8/);
    expect(fails(v.registerSchema, { ...ok, password: "allletters" }).message).toBe("Password must contain a digit");
    expect(fails(v.registerSchema, { ...ok, password: undefined }).message).toBe("Password is required");
  });
});

describe("loginSchema", () => {
  it("requires both fields", () => {
    expect(fails(v.loginSchema, { password: "x" }).message).toBe("Email is required");
    expect(fails(v.loginSchema, { email: "", password: "x" }).message).toBe("Email is required");
    expect(fails(v.loginSchema, { email: "a@b.c", password: "" }).message).toBe("Password is required");
  });
});

describe("categorySchema", () => {
  it("accepts and trims", () => {
    expect(v.parse(v.categorySchema, { name: " Rent ", type: "expense" })).toEqual({ name: "Rent", type: "expense" });
  });
  it("rejects bad name and type", () => {
    expect(fails(v.categorySchema, { name: "", type: "expense" }).message).toBe("Name is required");
    expect(fails(v.categorySchema, { name: "a".repeat(51), type: "expense" }).message).toBe("Name is too long");
    expect(v.parse(v.categorySchema, { name: "a".repeat(50), type: "income" }).name).toHaveLength(50);
    expect(fails(v.categorySchema, { name: "x", type: "transfer" }).message).toBe("Type must be income or expense");
  });
  it("update only needs a name", () => {
    expect(v.parse(v.categoryUpdateSchema, { name: "New", type: "income" })).toEqual({ name: "New" });
  });
});

describe("transactionSchema", () => {
  const ok = { type: "expense", amount: 42.1, categoryId: "3", description: " lunch ", date: "2026-05-04" };
  it("accepts a valid payload and coerces the category id", () => {
    expect(v.parse(v.transactionSchema, ok)).toEqual({ ...ok, categoryId: 3, description: "lunch" });
  });
  it("defaults the description to empty", () => {
    expect(v.parse(v.transactionSchema, { ...ok, description: undefined }).description).toBe("");
  });
  it("limits the description to 200 characters", () => {
    expect(v.parse(v.transactionSchema, { ...ok, description: "d".repeat(200) }).description).toHaveLength(200);
    expect(fails(v.transactionSchema, { ...ok, description: "d".repeat(201) }).message).toBe("Description is too long");
  });
  it("rejects invalid amounts", () => {
    expect(fails(v.transactionSchema, { ...ok, amount: 0 }).message).toBe("Amount must be greater than 0");
    expect(fails(v.transactionSchema, { ...ok, amount: -5 }).message).toBe("Amount must be greater than 0");
    expect(fails(v.transactionSchema, { ...ok, amount: "12" }).message).toBe("Amount must be a number");
    expect(fails(v.transactionSchema, { ...ok, amount: 1.234 }).message).toBe("Amount can have at most 2 decimal places");
    expect(fails(v.transactionSchema, { ...ok, amount: 1e11 }).message).toBe("Amount is too large");
    expect(fails(v.transactionSchema, { ...ok, amount: undefined }).message).toBe("Amount must be a number");
  });
  it("accepts the smallest and largest amounts", () => {
    expect(v.parse(v.transactionSchema, { ...ok, amount: 0.01 }).amount).toBe(0.01);
    expect(v.parse(v.transactionSchema, { ...ok, amount: 9999999999.99 }).amount).toBe(9999999999.99);
    expect(v.parse(v.transactionSchema, { ...ok, amount: 19.99 }).amount).toBe(19.99);
  });
  it("rejects invalid type, category and date", () => {
    expect(fails(v.transactionSchema, { ...ok, type: "other" }).message).toBe("Type must be income or expense");
    expect(fails(v.transactionSchema, { ...ok, categoryId: 0 }).details[0].field).toBe("categoryId");
    expect(fails(v.transactionSchema, { ...ok, categoryId: 1.5 }).details[0].field).toBe("categoryId");
    expect(fails(v.transactionSchema, { ...ok, categoryId: "abc" }).details[0].field).toBe("categoryId");
    expect(fails(v.transactionSchema, { ...ok, date: "2026-02-30" }).message).toBe("Date must be a valid YYYY-MM-DD date");
    expect(fails(v.transactionSchema, { ...ok, date: undefined }).message).toBe("Date is required");
  });
});

describe("transactionQuerySchema", () => {
  it("applies defaults", () => {
    expect(v.parse(v.transactionQuerySchema, {})).toEqual({ page: 1, limit: 20 });
  });
  it("coerces numbers and keeps filters", () => {
    expect(v.parse(v.transactionQuerySchema, { page: "2", limit: "50", type: "income", categoryId: "4", from: "2026-01-01", to: "2026-01-31" })).toEqual({
      page: 2, limit: 50, type: "income", categoryId: 4, from: "2026-01-01", to: "2026-01-31",
    });
  });
  it("bounds page and limit", () => {
    expect(fails(v.transactionQuerySchema, { page: "0" }).details[0].field).toBe("page");
    expect(fails(v.transactionQuerySchema, { limit: "0" }).details[0].field).toBe("limit");
    expect(fails(v.transactionQuerySchema, { limit: "101" }).details[0].field).toBe("limit");
    expect(v.parse(v.transactionQuerySchema, { limit: "100" }).limit).toBe(100);
    expect(v.parse(v.transactionQuerySchema, { page: "1" }).page).toBe(1);
  });
  it("rejects a reversed date range but allows equal dates", () => {
    expect(fails(v.transactionQuerySchema, { from: "2026-02-01", to: "2026-01-01" }).message).toBe("'from' must not be after 'to'");
    expect(v.parse(v.transactionQuerySchema, { from: "2026-02-01", to: "2026-02-01" }).from).toBe("2026-02-01");
    expect(v.parse(v.transactionQuerySchema, { from: "2026-02-01" }).from).toBe("2026-02-01");
    expect(v.parse(v.transactionQuerySchema, { to: "2026-02-01" }).to).toBe("2026-02-01");
  });
  it("rejects an invalid type", () => {
    expect(fails(v.transactionQuerySchema, { type: "x" }).details[0].field).toBe("type");
  });
});

describe("budget schemas", () => {
  const ok = { categoryId: 2, amount: 400, period: "monthly", startDate: "2026-05-01" };
  it("accepts a valid budget", () => expect(v.parse(v.budgetSchema, ok)).toEqual(ok));
  it("accepts each period", () => {
    for (const period of ["weekly", "monthly", "yearly"]) expect(v.parse(v.budgetSchema, { ...ok, period }).period).toBe(period);
  });
  it("rejects bad period, amount and date", () => {
    expect(fails(v.budgetSchema, { ...ok, period: "daily" }).message).toBe("Period must be weekly, monthly or yearly");
    expect(fails(v.budgetSchema, { ...ok, amount: 0 }).message).toBe("Amount must be greater than 0");
    expect(fails(v.budgetSchema, { ...ok, startDate: "2026-13-01" }).message).toBe("Date must be a valid YYYY-MM-DD date");
  });
  it("update ignores the category", () => {
    expect(v.parse(v.budgetUpdateSchema, ok)).toEqual({ amount: 400, period: "monthly", startDate: "2026-05-01" });
  });
});

describe("idParamSchema / analyticsQuerySchema", () => {
  it("coerces a positive integer id", () => expect(v.parse(v.idParamSchema, { id: "12" })).toEqual({ id: 12 }));
  it("rejects zero, negatives, fractions and text", () => {
    for (const id of ["0", "-1", "1.5", "abc"]) expect(fails(v.idParamSchema, { id }).code).toBe("VALIDATION_ERROR");
  });
  it("analytics months default to 6 and are bounded to 1..24", () => {
    expect(v.parse(v.analyticsQuerySchema, {})).toEqual({ months: 6 });
    expect(v.parse(v.analyticsQuerySchema, { months: "1" }).months).toBe(1);
    expect(v.parse(v.analyticsQuerySchema, { months: "24" }).months).toBe(24);
    expect(fails(v.analyticsQuerySchema, { months: "0" }).details[0].field).toBe("months");
    expect(fails(v.analyticsQuerySchema, { months: "25" }).details[0].field).toBe("months");
  });
});
