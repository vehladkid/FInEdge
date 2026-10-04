import { test, expect } from "@playwright/test";
import { api, apiRegister, categoryIds, signedIn, todayIso } from "./helpers.js";

test.describe("categories", () => {
  let session;
  test.beforeEach(async ({ page, request }) => {
    session = await apiRegister(request);
    await signedIn(page, session);
  });

  test("creates, renames and deletes a category, and uses it in a transaction", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByText("Food & Dining")).toBeVisible();
    await page.getByLabel("Category name").fill("Pets");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Pets", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Rename Pets" }).click();
    await page.getByLabel("Rename Pets").fill("Pet care");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Pet care", { exact: true })).toBeVisible();

    await page.goto("/add-transaction");
    await page.getByLabel("Amount").fill("20");
    await page.getByLabel("Category").selectOption({ label: "Pet care" });
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status")).toBeVisible();

    await page.goto("/categories");
    await page.getByRole("button", { name: "Delete Pet care" }).click();
    await expect(page.getByRole("alert")).toHaveText("Category is used by 1 transaction and cannot be deleted");

    await page.getByRole("button", { name: "Delete Other", exact: true }).click(); // unused: allowed
    await expect(page.getByText("Other", { exact: true })).toHaveCount(0);
  });

  test("rejects a duplicate name", async ({ page }) => {
    await page.goto("/categories");
    await page.getByLabel("Category name").fill("Transport");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("A category with this name already exists");
  });
});

test.describe("analytics and insights", () => {
  let session, ids;
  test.beforeEach(async ({ page, request }) => {
    session = await apiRegister(request);
    ids = await categoryIds(request, session.token);
    await signedIn(page, session);
  });

  test("shows an empty state without data", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByText(/No transactions in this period yet/)).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByLabel("Insights")).toContainText("Add some transactions this month to start receiving insights.");
  });

  test("summarises real data and renders the charts", async ({ page, request }) => {
    const a = api(request, session.token);
    await a.post("/api/transactions", { type: "income", amount: 3000, categoryId: ids.Salary, description: "", date: todayIso() });
    await a.post("/api/transactions", { type: "expense", amount: 410, categoryId: ids.Shopping, description: "", date: todayIso() });
    await a.post("/api/transactions", { type: "expense", amount: 340, categoryId: ids["Food & Dining"], description: "", date: todayIso() });
    await page.goto("/analytics");
    await expect(page.getByTestId("summary-Income")).toHaveText("$3,000.00");
    await expect(page.getByTestId("summary-Expenses")).toHaveText("$750.00");
    await expect(page.getByTestId("summary-Net")).toHaveText("$2,250.00");
    await expect(page.getByTestId("summary-Savings rate")).toHaveText("75%");
    for (const id of ["category-chart", "monthly-chart", "daily-chart"]) {
      await expect(page.getByTestId(id).locator("svg").first()).toBeVisible();
    }
    await expect(page.getByTestId("category-chart").locator(".recharts-pie-sector")).toHaveCount(2);
    await expect(page.getByTestId("monthly-chart").locator(".recharts-bar-rectangle")).not.toHaveCount(0);
  });

  test("the date range control reloads the report", async ({ page, request }) => {
    await api(request, session.token).post("/api/transactions", { type: "expense", amount: 9, categoryId: ids.Other, description: "", date: todayIso() });
    await page.goto("/analytics");
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes("/api/analytics?months=12")),
      page.getByLabel("Date range").selectOption("12"),
    ]);
    expect(req).toBeTruthy();
    await expect(page.getByTestId("summary-Expenses")).toHaveText("$9.00");
  });

  test("dashboard insights flag overspending (rule-based fallback)", async ({ page, request }) => {
    const a = api(request, session.token);
    await a.post("/api/transactions", { type: "income", amount: 1000, categoryId: ids.Salary, description: "", date: todayIso() });
    await a.post("/api/transactions", { type: "expense", amount: 1250, categoryId: ids.Shopping, description: "", date: todayIso() });
    await page.goto("/dashboard");
    await expect(page.getByText("Rule-based analysis of your transactions")).toBeVisible();
    await expect(page.getByLabel("Insights")).toContainText("You have spent $250.00 more than you earned this month.");
  });
});
