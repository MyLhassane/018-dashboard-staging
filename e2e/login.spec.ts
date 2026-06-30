import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("دخول");
    await expect(page.getByPlaceholder(/البريد/)).toBeVisible();
    await expect(page.getByPlaceholder(/كلمة/)).toBeVisible();
  });

  test("redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/البريد/).fill("wrong@email.com");
    await page.getByPlaceholder(/كلمة/).fill("wrongpass");
    await page.getByRole("button", { name: /دخول/ }).click();
    await expect(page.getByText(/خطأ|غير صحيحة/i)).toBeVisible();
  });
});
