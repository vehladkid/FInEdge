import { test, expect } from "@playwright/test";
import { apiRegister, openNav, PASSWORD, uniqueEmail } from "./helpers.js";

test.describe("authentication", () => {
  test("registers, lands on an empty dashboard, then logs out", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Name").fill("Ada Lovelace");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Register" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("You have no transactions yet")).toBeVisible();
    await expect(page.getByTestId("card-Total Balance")).toHaveText("$0.00");

    await openNav(page);
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logs in with valid credentials and returns to the requested page", async ({ page, request }) => {
    const email = uniqueEmail();
    const res = await request.post("http://127.0.0.1:5100/api/auth/register", { data: { name: "Grace", email, password: PASSWORD } });
    expect(res.ok()).toBeTruthy();

    await page.goto("/budget"); // protected: bounced to login, remembered
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/budget$/);
    await expect(page.getByRole("heading", { name: "Budget Tracking" })).toBeVisible();
  });

  test("shows an error for a wrong password", async ({ page, request }) => {
    const { user } = await apiRegister(request);
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill("wrongpassword1");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid email or password");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("shows validation errors from the server on registration", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Name").fill("Bob");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("alert")).toHaveText("Email is invalid");
  });

  test("rejects a duplicate email", async ({ page, request }) => {
    const { user } = await apiRegister(request);
    await page.goto("/register");
    await page.getByLabel("Name").fill("Dup");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("alert")).toHaveText("An account with this email already exists");
  });

  test("every protected route redirects an anonymous visitor to login", async ({ page }) => {
    for (const path of ["/dashboard", "/transactions", "/add-transaction", "/categories", "/analytics", "/budget"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/login$/);
    }
  });

  test("an invalid stored token is discarded", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("finedge.token", "garbage"));
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem("finedge.token"))).toBeNull();
  });

  test("a session expiring mid-use sends the user back to login", async ({ page, request }) => {
    const session = await apiRegister(request);
    await page.addInitScript((t) => localStorage.setItem("finedge.token", t), session.token);
    await page.goto("/dashboard");
    await expect(page.getByTestId("card-Total Balance")).toBeVisible();
    await page.route("**/api/transactions**", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } }) })
    );
    await openNav(page);
    await page.getByRole("link", { name: "Transactions" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
