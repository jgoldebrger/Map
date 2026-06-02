import { test, expect } from "@playwright/test";
import { isDbReady } from "./db-ready";

test.describe("Public pages", () => {
  test("home page loads with SIP branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Shipping Intelligence Platform/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /View Map/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /ZIP Lookup/i })).toBeVisible();
  });

  test("lookup page renders search form", async ({ page }) => {
    await page.goto("/lookup");
    await expect(page.getByText("Shipping Lookup")).toBeVisible();
    await expect(page.getByRole("button", { name: /Look up/i })).toBeVisible();
  });

  test("map page loads", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByText("Shipping Intelligence Platform")).toBeVisible();
    await expect(page.getByPlaceholder(/Search ZIP/i)).toBeVisible();
  });
});

test.describe("Public API", () => {
  test.beforeEach(({ }, testInfo) => {
    if (!isDbReady()) {
      testInfo.skip(true, "Database not available (check DATABASE_URL in .env)");
    }
  });

  test("shipping methods API returns a list", async ({ request }) => {
    const res = await request.get("/api/shipping-methods");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test("territory lookup works when territories exist", async ({ request }, testInfo) => {
    const listRes = await request.get("/api/territories");
    expect(listRes.ok()).toBeTruthy();
    const territories = await listRes.json();
    if (!Array.isArray(territories) || territories.length === 0) {
      testInfo.skip(true, "No territories in database");
      return;
    }
    const name = territories[0].name as string;
    const res = await request.get(`/api/lookup?type=territory&q=${encodeURIComponent(name)}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.territory).toBeTruthy();
    expect(data.shippingMethod).toBeTruthy();
  });

  test("county assignments endpoint responds", async ({ request }) => {
    const res = await request.get("/api/counties/assignments");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(typeof data).toBe("object");
  });
});
