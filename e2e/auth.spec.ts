import { test, expect } from "@playwright/test";
import { isDbReady } from "./db-ready";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "jgoldberger@fabuwood.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "changeme";

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
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  });

  test("admin territories page loads after login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/);

    await page.goto("/admin/territories");
    await expect(page.getByRole("heading", { name: /Territories/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add Territory/i })).toBeVisible({ timeout: 10_000 });
  });
});
