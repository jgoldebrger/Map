import { test, expect } from "@playwright/test";
import { isDbReady } from "./db-ready";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "jgoldberger@fabuwood.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "changeme";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
}

test.describe("Admin portal", () => {
  test.beforeEach(({ }, testInfo) => {
    if (!isDbReady()) {
      testInfo.skip(true, "Database not available (set DATABASE_URL in CI secrets)");
    }
  });

  test("core admin pages load", async ({ page }) => {
    await loginAsAdmin(page);

    const pages: { path: string; heading: RegExp }[] = [
      { path: "/admin", heading: /Dashboard/i },
      { path: "/admin/shipping-methods", heading: /Shipping Methods/i },
      { path: "/admin/territories", heading: /Territories/i },
      { path: "/admin/map", heading: /Map Editor/i },
      { path: "/admin/zipcodes", heading: /ZIP Codes/i },
      { path: "/admin/import", heading: /CSV Import/i },
      { path: "/admin/audit", heading: /Audit History/i },
    ];

    for (const { path, heading } of pages) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test("shipping methods API is writable for admin", async ({ page, request }) => {
    await loginAsAdmin(page);
    const res = await request.get("/api/shipping-methods");
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray(await res.json())).toBeTruthy();
  });
});
