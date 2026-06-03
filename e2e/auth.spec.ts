import { test, expect } from "@playwright/test";
import { isDbReady } from "./db-ready";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Authentication", () => {
  test.beforeEach(({ }, testInfo) => {
    if (!isDbReady()) {
      testInfo.skip(true, "Database not available (start Docker: docker compose up -d)");
    }
  });

  test("admin routes redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with valid credentials reaches dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  });

  test("admin territories page loads after login", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/admin/territories");
    await expect(page.getByRole("heading", { name: /Territories/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add Territory/i })).toBeVisible({ timeout: 10_000 });
  });
});
