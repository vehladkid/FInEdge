import { test, expect } from "@playwright/test";
import { api, apiRegister, categoryIds, noHorizontalOverflow, openNav, signedIn, todayIso } from "./helpers.js";

// Runs on every viewport project (1440x900, 1280x800, 390x844).
test.describe("responsive layout", () => {
  let session;
  test.beforeEach(async ({ page, request }) => {
    session = await apiRegister(request);
    const ids = await categoryIds(request, session.token);
    const a = api(request, session.token);
    await a.post("/api/transactions", { type: "income", amount: 3000, categoryId: ids.Salary, description: "Salary", date: todayIso() });
    await a.post("/api/transactions", { type: "expense", amount: 410, categoryId: ids.Shopping, description: "A fairly long description to stress the table layout", date: todayIso() });
    await a.post("/api/budgets", { categoryId: ids.Shopping, amount: 500, period: "monthly", startDate: todayIso().slice(0, 7) + "-01" });
    await signedIn(page, session);
  });

  for (const path of ["/dashboard", "/transactions", "/add-transaction", "/categories", "/analytics", "/budget"]) {
    test(`${path} fits the viewport and its content is visible`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("status")).toHaveCount(0); // loading finished
      await noHorizontalOverflow(page);
    });
  }

  test("public pages fit the viewport", async ({ page }) => {
    for (const path of ["/", "/login", "/register"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await noHorizontalOverflow(page);
    }
  });

  test("the main navigation works on this viewport", async ({ page }) => {
    await page.goto("/dashboard");
    const isMobile = (page.viewportSize()?.width ?? 1000) < 768;
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible({ visible: isMobile });
    for (const [label, url] of [["Transactions", /transactions$/], ["Budgets", /budget$/], ["Analytics", /analytics$/], ["Dashboard", /dashboard$/]]) {
      await openNav(page);
      await page.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(url);
    }
  });

  test("charts render and buttons stay clickable", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByTestId("category-chart").locator("svg").first()).toBeVisible();
    const box = await page.getByTestId("monthly-chart").boundingBox();
    expect(box.width).toBeGreaterThan(200);
    await page.goto("/budget");
    await page.getByRole("button", { name: "+ New Budget" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await noHorizontalOverflow(page);
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("the add-transaction form is fully usable", async ({ page }) => {
    await page.goto("/add-transaction");
    await page.getByLabel("Amount").fill("15");
    await page.getByLabel("Description").fill("viewport check");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status")).toHaveText("Transaction saved.");
  });
});
