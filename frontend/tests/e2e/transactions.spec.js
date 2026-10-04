import { test, expect } from "@playwright/test";
import { api, apiRegister, categoryIds, openNav, signedIn, todayIso } from "./helpers.js";

test.describe("transactions", () => {
  let session;
  test.beforeEach(async ({ page, request }) => {
    session = await apiRegister(request);
    await signedIn(page, session);
  });

  test("adds an expense and it appears in the list and on the dashboard", async ({ page }) => {
    await page.goto("/add-transaction");
    await page.getByLabel("Amount").fill("42.10");
    await page.getByLabel("Category").selectOption({ label: "Food & Dining" });
    await page.getByLabel("Description").fill("Grocery run");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status")).toHaveText("Transaction saved.");

    await page.goto("/transactions");
    const row = page.getByRole("row", { name: /Grocery run/ });
    await expect(row).toContainText("Food & Dining");
    await expect(row).toContainText("−$42.10");

    await page.goto("/dashboard");
    await expect(page.getByTestId("card-Expenses (Month)")).toHaveText("$42.10");
    await expect(page.getByTestId("card-Total Balance")).toHaveText("-$42.10");
    await expect(page.getByLabel("Recent transactions")).toContainText("Grocery run");
  });

  test("adds income, which raises the balance", async ({ page }) => {
    await page.goto("/add-transaction");
    await page.getByLabel("Type").selectOption("income");
    await page.getByLabel("Amount").fill("3000");
    await expect(page.getByLabel("Category")).toHaveValue(/\d+/);
    await page.getByLabel("Category").selectOption({ label: "Salary" });
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByTestId("card-Income (Month)")).toHaveText("$3,000.00");
    await expect(page.getByTestId("card-Total Balance")).toHaveText("$3,000.00");
  });

  test("validates the amount before submitting", async ({ page }) => {
    await page.goto("/add-transaction");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("alert")).toHaveText("Enter an amount greater than 0.");
  });

  test("edits and deletes a transaction", async ({ page, request }) => {
    const ids = await categoryIds(request, session.token);
    await api(request, session.token).post("/api/transactions", { type: "expense", amount: 10, categoryId: ids.Transport, description: "Bus", date: todayIso() });
    await page.goto("/transactions");
    await page.getByRole("button", { name: "Edit Bus" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit transaction" });
    await dialog.getByLabel("Amount").fill("12.75");
    await dialog.getByLabel("Description").fill("Bus and tram");
    await dialog.getByRole("button", { name: "Update" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("row", { name: /Bus and tram/ })).toContainText("−$12.75");

    await page.getByRole("button", { name: "Delete Bus and tram" }).click();
    await expect(page.getByText("No transactions found.")).toBeVisible();
  });

  test("filters by type and category", async ({ page, request }) => {
    const ids = await categoryIds(request, session.token);
    const a = api(request, session.token);
    await a.post("/api/transactions", { type: "expense", amount: 5, categoryId: ids.Transport, description: "Taxi", date: todayIso() });
    await a.post("/api/transactions", { type: "expense", amount: 6, categoryId: ids.Shopping, description: "Socks", date: todayIso() });
    await a.post("/api/transactions", { type: "income", amount: 700, categoryId: ids.Salary, description: "Pay", date: todayIso() });
    await page.goto("/transactions");
    await expect(page.getByRole("row")).toHaveCount(4); // header + 3

    await page.getByLabel("Filter by type").selectOption("income");
    await expect(page.getByRole("row", { name: /Pay/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Taxi/ })).toHaveCount(0);

    await page.getByLabel("Filter by type").selectOption("");
    await page.getByLabel("Filter by category").selectOption({ label: "Shopping" });
    await expect(page.getByRole("row", { name: /Socks/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Taxi/ })).toHaveCount(0);
  });

  test("paginates long lists", async ({ page, request }) => {
    const ids = await categoryIds(request, session.token);
    for (let i = 1; i <= 12; i++) {
      await api(request, session.token).post("/api/transactions", { type: "expense", amount: i, categoryId: ids.Other, description: `Item ${i}`, date: todayIso() });
    }
    await page.goto("/transactions");
    await expect(page.getByText("Page 1 of 2")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("Page 2 of 2")).toBeVisible();
    await expect(page.getByRole("row")).toHaveCount(3); // header + 2
  });

  test("shows an error state with retry when the API is unreachable", async ({ page }) => {
    await page.route("**/api/transactions**", (route) => route.abort("failed"));
    await page.goto("/transactions");
    await expect(page.getByRole("alert").first()).toContainText("Cannot reach the server");
    await page.unroute("**/api/transactions**");
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("No transactions found.")).toBeVisible();
  });

  test("navigation links reach the transaction pages", async ({ page }) => {
    await page.goto("/dashboard");
    await openNav(page);
    await page.getByRole("link", { name: "Add Transaction" }).click();
    await expect(page).toHaveURL(/\/add-transaction$/);
  });
});
