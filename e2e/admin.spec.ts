import { test, expect } from "@playwright/test";
import { isDbReady } from "./db-ready";
import { loginAsAdmin } from "./helpers/auth";

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

  test("shipping methods API is readable for admin", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.request.get("/api/shipping-methods");
    expect(res.ok()).toBeTruthy();
    expect(Array.isArray(await res.json())).toBeTruthy();
  });
});
