import { test, expect } from "@playwright/test";
import { isDbReady } from "./db-ready";

test.describe("Public pages", () => {
  test("home page loads with SIP branding", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /One live map for every shipping method/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /View map/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /ZIP lookup/i })).toBeVisible();
  });

  test("lookup page renders search form", async ({ page }) => {
    await page.goto("/lookup");
    await expect(
      page.getByRole("heading", { name: /ZIP & territory lookup/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Look up/i })).toBeVisible();
  });

  test("map page loads", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByText("Shipping Intelligence Platform")).toBeVisible();
    await expect(page.getByPlaceholder(/Search ZIP/i)).toBeVisible();
  });

  test("embed map loads without full site chrome", async ({ page }) => {
    await page.goto("/embed/map");
    await expect(page.getByText("Fabuwood shipping territories")).toBeVisible();
    await expect(page.getByRole("link", { name: /Open full map/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search ZIP/i)).toBeVisible();
    await expect(page.getByText("Shipping Intelligence Platform")).not.toBeVisible();
  });

  test("embed route allows framing via CSP frame-ancestors", async ({ request }) => {
    const res = await request.get("/embed/map");
    expect(res.ok()).toBeTruthy();
    const csp = res.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("frame-ancestors");
    expect(csp).toContain("'self'");
  });

  test("public map denies iframe embedding", async ({ request }) => {
    const res = await request.get("/map");
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["x-frame-options"]).toBe("DENY");
  });
});

test.describe("Public API", () => {
  test.beforeEach(({ }, testInfo) => {
    if (!isDbReady()) {
      testInfo.skip(true, "Database not available (check DATABASE_URL in .env)");
    }
  });

  test("admin list APIs require authentication", async ({ request }) => {
    expect((await request.get("/api/shipping-methods")).status()).toBe(401);
    expect((await request.get("/api/territories")).status()).toBe(401);
  });

  test("lookup by territory name when data exists", async ({ request }, testInfo) => {
    const res = await request.get("/api/lookup?type=territory&q=test");
    if (res.status() === 404) {
      testInfo.skip(true, "No matching territory in database");
      return;
    }
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
