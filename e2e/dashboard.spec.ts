import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "";

test.describe("Dashboard E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Skip tests if no credentials
    test.skip(!ADMIN_EMAIL, "TEST_ADMIN_EMAIL not set");
  });

  test("overview page shows stats", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/البريد/).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/كلمة/).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /دخول/ }).click();
    await expect(page).toHaveURL("/");
    await expect(page.locator("h1")).toContainText("لوحة التحكم");
  });

  test("navigates to challenges page", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/البريد/).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/كلمة/).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /دخول/ }).click();
    await page.goto("/challenges");
    await expect(page.locator("h1")).toContainText("التحديات");
  });

  test("navigates to players page", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/البريد/).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/كلمة/).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /دخول/ }).click();
    await page.goto("/players");
    await expect(page.locator("h1")).toContainText("اللاعبون");
  });

  test("navigates to categories page", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/البريد/).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/كلمة/).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /دخول/ }).click();
    await page.goto("/categories");
    await expect(page.locator("h1")).toContainText("التصنيفات");
  });
});
