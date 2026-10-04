import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { pool } from "../../src/db/pool.js";
import { makeApp, register, resetDb, authed } from "./helpers.js";

const app = makeApp();
beforeEach(resetDb);

describe("POST /api/auth/register", () => {
  it("creates an account, returns a token and never exposes the hash", async () => {
    const { res, body } = await register(app, { email: "Ada@Example.com", name: "Ada" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ name: "Ada", email: "ada@example.com" });
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    expect(res.body.data.token).toEqual(expect.any(String));
    const { rows } = await pool.query("SELECT password_hash FROM users");
    expect(rows[0].password_hash).not.toBe(body.password);
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
  });

  it("seeds default categories for the new user", async () => {
    const { token } = await register(app);
    const res = await authed(app, token).get("/api/categories");
    expect(res.body.data).toHaveLength(9);
    expect(res.body.data.map((c) => c.name)).toEqual(expect.arrayContaining(["Food & Dining", "Salary"]));
  });

  it("rejects a duplicate email regardless of case", async () => {
    await register(app, { email: "dup@example.com" });
    const { res } = await register(app, { email: "DUP@example.com" });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ success: false, error: { code: "CONFLICT", message: "An account with this email already exists" } });
  });

  it("handles two simultaneous registrations of the same email", async () => {
    const send = () => request(app).post("/api/auth/register").send({ name: "R", email: "race@example.com", password: "password123" });
    const results = await Promise.all([send(), send()]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it.each([
    [{ name: "" }, "Name is required"],
    [{ email: "bad" }, "Email is invalid"],
    [{ password: "short1" }, "Password must be at least 8 characters"],
    [{ password: "lettersonly" }, "Password must contain a digit"],
  ])("rejects invalid input %j", async (override, message) => {
    const { res } = await register(app, override);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toBe(message);
    expect(res.body.error.details[0]).toHaveProperty("field");
  });

  it("rejects a malformed JSON body with 400", async () => {
    const res = await request(app).post("/api/auth/register").set("Content-Type", "application/json").send("{oops");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MALFORMED_JSON");
  });
});

describe("POST /api/auth/login", () => {
  it("returns the user and a token for valid credentials", async () => {
    const { body } = await register(app, { email: "login@example.com" });
    const res = await request(app).post("/api/auth/login").send({ email: "LOGIN@example.com", password: body.password });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("login@example.com");
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it("rejects a wrong password and an unknown email identically", async () => {
    const { body } = await register(app, { email: "who@example.com" });
    const wrong = await request(app).post("/api/auth/login").send({ email: body.email, password: "nottherightone1" });
    const unknown = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "password123" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("validates the payload", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});

describe("authentication guard", () => {
  it("GET /api/auth/me returns the current user", async () => {
    const { token, user } = await register(app);
    const res = await authed(app, token).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ id: user.id, email: user.email });
  });

  it("rejects requests without a token", async () => {
    for (const url of ["/api/auth/me", "/api/transactions", "/api/budgets", "/api/categories", "/api/dashboard", "/api/analytics", "/api/insights"]) {
      const res = await request(app).get(url);
      expect(res.status, url).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("rejects an invalid token, a wrong scheme, and an expired token", async () => {
    const bad = await request(app).get("/api/auth/me").set("Authorization", "Bearer not.a.jwt");
    expect(bad.status).toBe(401);
    const scheme = await request(app).get("/api/auth/me").set("Authorization", "Basic abc");
    expect(scheme.status).toBe(401);
    const empty = await request(app).get("/api/auth/me").set("Authorization", "Bearer");
    expect(empty.status).toBe(401);
    const expired = jwt.sign({ sub: "1" }, "test-secret", { expiresIn: -10 });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid or expired token");
    const forged = jwt.sign({ sub: "1" }, "other-secret");
    expect((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${forged}`)).status).toBe(401);
  });

  it("rejects a valid token whose user no longer exists", async () => {
    const { token } = await register(app);
    await pool.query("DELETE FROM users");
    const res = await authed(app, token).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("misc", () => {
  it("keeps the health check", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/FinEdge/);
  });
  it("answers unknown routes with a JSON 404", async () => {
    const { token } = await register(app);
    const res = await authed(app, token).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: "NOT_FOUND" } });
  });
});
