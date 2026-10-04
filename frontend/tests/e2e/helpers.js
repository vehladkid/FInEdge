import { expect } from "@playwright/test";

const API = "http://127.0.0.1:5100";
let counter = 0;

export const uniqueEmail = () => `e2e${Date.now()}${Math.random().toString(36).slice(2, 8)}${counter++}@example.com`;
export const PASSWORD = "password123";
export const todayIso = () => new Date().toLocaleDateString("en-CA");

// Registers through the API and returns {token, user}; fast path for tests that are not about sign-up.
export async function apiRegister(request, name = "E2E User") {
  const res = await request.post(`${API}/api/auth/register`, { data: { name, email: uniqueEmail(), password: PASSWORD } });
  expect(res.status()).toBe(201);
  return (await res.json()).data;
}

export const api = (request, token) => ({
  get: (u) => request.get(`${API}${u}`, { headers: { Authorization: `Bearer ${token}` } }),
  post: (u, data) => request.post(`${API}${u}`, { data, headers: { Authorization: `Bearer ${token}` } }),
});

export async function categoryIds(request, token) {
  const res = await api(request, token).get("/api/categories");
  return Object.fromEntries((await res.json()).data.map((c) => [c.name, c.id]));
}

// Opens the app already signed in as `session` (token seeded before any page script runs).
export async function signedIn(page, session) {
  await page.addInitScript((token) => localStorage.setItem("finedge.token", token), session.token);
}

export async function noHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(0);
}

// On narrow screens the nav is collapsed behind a Menu button.
export async function openNav(page) {
  const menu = page.getByRole("button", { name: "Menu" });
  if (await menu.isVisible()) await menu.click();
}
