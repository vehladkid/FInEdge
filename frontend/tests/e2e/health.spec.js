import { test, expect } from "@playwright/test";
import { api, apiRegister, categoryIds, signedIn, todayIso } from "./helpers.js";

test("every page loads without console errors, page errors or failed requests", async ({ page, request }) => {
  const session = await apiRegister(request);
  const ids = await categoryIds(request, session.token);
  await api(request, session.token).post("/api/transactions", { type: "expense", amount: 20, categoryId: ids.Transport, description: "t", date: todayIso() });
  await signedIn(page, session);

  const problems = [];
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => problems.push(`requestfailed: ${r.url()}`));
  page.on("response", (r) => r.status() >= 400 && problems.push(`http ${r.status()}: ${r.url()}`));

  for (const path of ["/", "/login", "/register", "/dashboard", "/transactions", "/add-transaction", "/categories", "/analytics", "/budget"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");
  }
  expect(problems).toEqual([]);
});

test("the landing page links to registration and login, and reflects backend status", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("connected")).toBeVisible();
  await page.getByRole("link", { name: "Get Started" }).click();
  await expect(page).toHaveURL(/\/register$/);
  await page.getByRole("link", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
