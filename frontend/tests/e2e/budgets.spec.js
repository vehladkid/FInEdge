import { test, expect } from "@playwright/test";
import { api, apiRegister, categoryIds, signedIn, todayIso } from "./helpers.js";

test.describe("budgets", () => {
  let session, ids;
  test.beforeEach(async ({ page, request }) => {
    session = await apiRegister(request);
    ids = await categoryIds(request, session.token);
    await signedIn(page, session);
  });

  const spend = (request, categoryId, amount, description = "") =>
    api(request, session.token).post("/api/transactions", { type: "expense", amount, categoryId, description, date: todayIso() });

  test("shows an empty state, then creates a budget", async ({ page }) => {
    await page.goto("/budget");
    await expect(page.getByText(/No budgets yet/)).toBeVisible();
    await page.getByRole("button", { name: "+ New Budget" }).click();
    const dialog = page.getByRole("dialog", { name: "New budget" });
    await dialog.getByLabel("Category").selectOption({ label: "Food & Dining" });
    await dialog.getByLabel("Limit").fill("400");
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog).toBeHidden();
    const card = page.getByRole("progressbar", { name: "Food & Dining budget used" });
    await expect(card).toHaveAttribute("aria-valuenow", "0");
    await expect(page.getByText("$0.00 / $400.00")).toBeVisible();
    await expect(page.getByText("0% used · $400.00 remaining")).toBeVisible();
  });

  test("spent, remaining and percentage reflect real transactions", async ({ page, request }) => {
    await api(request, session.token).post("/api/budgets", { categoryId: ids["Food & Dining"], amount: 400, period: "monthly", startDate: todayIso().slice(0, 7) + "-01" });
    await spend(request, ids["Food & Dining"], 100.5, "Dinner");
    await spend(request, ids["Food & Dining"], 150, "Groceries");
    await spend(request, ids.Transport, 999); // other category is not counted
    await page.goto("/budget");
    await expect(page.getByText("$250.50 / $400.00")).toBeVisible();
    await expect(page.getByText("62.6% used · $149.50 remaining")).toBeVisible();

    // adding a transaction through the UI updates the budget
    await page.goto("/add-transaction");
    await page.getByLabel("Amount").fill("200");
    await page.getByLabel("Category").selectOption({ label: "Food & Dining" });
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await page.goto("/budget");
    await expect(page.getByText("$450.50 / $400.00")).toBeVisible();
    await expect(page.getByText("112.6% used · $50.50 over budget")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Food & Dining budget used" })).toHaveAttribute("aria-valuenow", "100");
  });

  test("edits and deletes a budget", async ({ page, request }) => {
    await api(request, session.token).post("/api/budgets", { categoryId: ids.Utilities, amount: 100, period: "monthly", startDate: todayIso().slice(0, 7) + "-01" });
    await page.goto("/budget");
    await page.getByRole("button", { name: "Edit Utilities budget" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit budget" });
    await expect(dialog.getByLabel("Category")).toBeDisabled();
    await dialog.getByLabel("Limit").fill("250");
    await dialog.getByLabel("Period").selectOption("yearly");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("$0.00 / $250.00")).toBeVisible();
    await expect(page.getByText(/yearly/)).toBeVisible();

    await page.getByRole("button", { name: "Delete Utilities budget" }).click();
    await expect(page.getByText(/No budgets yet/)).toBeVisible();
  });

  test("rejects a duplicate budget with a clear message", async ({ page, request }) => {
    await api(request, session.token).post("/api/budgets", { categoryId: ids.Shopping, amount: 100, period: "monthly", startDate: todayIso().slice(0, 7) + "-01" });
    await page.goto("/budget");
    await page.getByRole("button", { name: "+ New Budget" }).click();
    const dialog = page.getByRole("dialog", { name: "New budget" });
    await dialog.getByLabel("Category").selectOption({ label: "Shopping" });
    await dialog.getByLabel("Limit").fill("50");
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog.getByRole("alert")).toHaveText("A budget for this category and period already exists");
  });

  test("validates the limit", async ({ page }) => {
    await page.goto("/budget");
    await page.getByRole("button", { name: "+ New Budget" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toHaveText("Enter an amount greater than 0.");
  });

  test("dashboard shows the active budget and a warning insight", async ({ page, request }) => {
    await api(request, session.token).post("/api/budgets", { categoryId: ids["Food & Dining"], amount: 100, period: "monthly", startDate: todayIso().slice(0, 7) + "-01" });
    await spend(request, ids["Food & Dining"], 130);
    await page.goto("/dashboard");
    await expect(page.getByLabel("Budget status")).toContainText("$130.00 / $100.00");
    await expect(page.getByLabel("Insights")).toContainText("You have exceeded your Food & Dining budget by $30.00.");
  });
});
