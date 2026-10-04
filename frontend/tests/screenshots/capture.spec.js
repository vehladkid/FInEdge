import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { api, apiRegister, categoryIds, PASSWORD } from "../e2e/helpers.js";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../docs/review3/screenshots/app");
const iso = (d) => d.toLocaleDateString("en-CA");
const monthsAgo = (n, day) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return iso(d);
};
const thisMonth = (day) => iso(new Date(new Date().getFullYear(), new Date().getMonth(), Math.min(day, new Date().getDate())));

async function seed(request) {
  const session = await apiRegister(request, "Demo User");
  const ids = await categoryIds(request, session.token);
  const a = api(request, session.token);
  const tx = (type, amount, cat, description, date) => a.post("/api/transactions", { type, amount, categoryId: ids[cat], description, date });
  for (const m of [2, 1]) {
    await tx("income", 3000, "Salary", "Monthly salary", monthsAgo(m, 1));
    await tx("expense", 950, "Utilities", "Rent & utilities", monthsAgo(m, 3));
    await tx("expense", 320 + m * 30, "Food & Dining", "Groceries", monthsAgo(m, 8));
    await tx("expense", 140, "Transport", "Metro pass", monthsAgo(m, 12));
    await tx("expense", 210 - m * 20, "Shopping", "Clothing", monthsAgo(m, 18));
    await tx("expense", 80, "Entertainment", "Cinema & streaming", monthsAgo(m, 22));
  }
  await tx("income", 3000, "Salary", "Monthly salary", thisMonth(1));
  await tx("income", 450, "Freelance", "Freelance project", thisMonth(2));
  await tx("expense", 950, "Utilities", "Rent & utilities", thisMonth(1));
  await tx("expense", 360, "Food & Dining", "Groceries", thisMonth(2));
  await tx("expense", 180, "Transport", "Fuel & metro", thisMonth(3));
  await tx("expense", 410, "Shopping", "Electronics accessory", thisMonth(3));
  await tx("expense", 95, "Entertainment", "Concert ticket", thisMonth(4));
  const start = iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const b = (cat, amount) => a.post("/api/budgets", { categoryId: ids[cat], amount, period: "monthly", startDate: start });
  await b("Food & Dining", 400);
  await b("Transport", 150);
  await b("Shopping", 600);
  await b("Entertainment", 200);
  return session;
}

const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(OUT, `${test.info().project.name}-${name}.png`), fullPage: true, animations: "disabled", ...opts });

test("capture figures", async ({ page, request }) => {
  test.setTimeout(120_000);
  const isMobile = test.info().project.name === "mobile";

  // Public pages and validation/error states
  await page.goto("/");
  await expect(page.getByText("connected")).toBeVisible();
  await shot(page, "01-landing");
  await page.goto("/register");
  await shot(page, "02-register");
  await page.goto("/login");
  await page.getByLabel("Email").fill("someone@example.com");
  await page.getByLabel("Password").fill("wrongpassword1");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await shot(page, "03-login-error");

  // Real registration through the UI, then data
  const session = await seed(request);
  await page.goto("/login");
  const email = session.user.email;
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByLabel("Recent transactions")).toBeVisible();
  await expect(page.getByLabel("Insights")).toBeVisible();
  await page.waitForTimeout(600);
  await shot(page, "04-dashboard");

  await page.goto("/transactions");
  await expect(page.getByRole("table")).toBeVisible();
  await shot(page, "05-transactions");

  await page.goto("/add-transaction");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await shot(page, "06-add-transaction-validation");
  await page.getByLabel("Amount").fill("64.50");
  await page.getByLabel("Category").selectOption({ label: "Food & Dining" });
  await page.getByLabel("Description").fill("Dinner with friends");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await shot(page, "07-add-transaction-saved");

  await page.goto("/transactions");
  await page.getByRole("button", { name: "Edit Dinner with friends" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await shot(page, "08-edit-transaction", { fullPage: false });
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.goto("/budget");
  await expect(page.getByRole("progressbar").first()).toBeVisible();
  await shot(page, "09-budgets");
  await page.getByRole("button", { name: "+ New Budget" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await shot(page, "10-new-budget-dialog", { fullPage: false });
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.goto("/categories");
  await expect(page.getByText("Salary")).toBeVisible();
  await shot(page, "11-categories");

  await page.goto("/analytics");
  await expect(page.getByTestId("category-chart").locator("svg").first()).toBeVisible();
  await page.waitForTimeout(600);
  await shot(page, "12-analytics");

  await page.goto("/dashboard");
  await expect(page.getByLabel("Insights")).toBeVisible();
  await page.getByLabel("Insights").scrollIntoViewIfNeeded();
  await shot(page, "13-insights", { fullPage: false });

  if (isMobile) {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Menu" }).click();
    await shot(page, "14-mobile-menu", { fullPage: false });
  }
});
