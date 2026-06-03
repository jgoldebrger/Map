import { expect, type Page } from "@playwright/test";

function requireEnv(name: "ADMIN_EMAIL" | "ADMIN_PASSWORD"): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (process.env.CI === "true") {
    throw new Error(`${name} must be set for E2E tests in CI`);
  }
  return name === "ADMIN_EMAIL" ? "admin@example.com" : "changeme";
}

export const ADMIN_EMAIL = requireEnv("ADMIN_EMAIL");
export const ADMIN_PASSWORD = requireEnv("ADMIN_PASSWORD");

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
}
