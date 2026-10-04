import request from "supertest";
import { createApp } from "../../src/app.js";
import { resetDb } from "./setup.js";
import { addDays, shiftMonths, startOfMonth } from "../../src/utils/dates.js";
import { today } from "../../src/utils/clock.js";

export { resetDb, addDays, shiftMonths, startOfMonth, today };

export const makeApp = (opts) => createApp(opts);

export async function register(app, overrides = {}) {
  const body = { name: "Test User", email: `user${Math.random().toString(36).slice(2)}@example.com`, password: "password123", ...overrides };
  const res = await request(app).post("/api/auth/register").send(body);
  return { res, body, token: res.body?.data?.token, user: res.body?.data?.user };
}

export const authed = (app, token) => ({
  get: (url) => request(app).get(url).set("Authorization", `Bearer ${token}`),
  post: (url, body) => request(app).post(url).set("Authorization", `Bearer ${token}`).send(body),
  put: (url, body) => request(app).put(url).set("Authorization", `Bearer ${token}`).send(body),
  delete: (url) => request(app).delete(url).set("Authorization", `Bearer ${token}`),
});

export async function categoryId(api, name) {
  const res = await api.get("/api/categories");
  return res.body.data.find((c) => c.name === name).id;
}
