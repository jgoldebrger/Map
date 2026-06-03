import { test, expect } from "@playwright/test";
import { isDbReady } from "./db-ready";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Health checks", () => {
  test.beforeEach(({ }, testInfo) => {
    if (!isDbReady()) {
      testInfo.skip(true, "Database not available (set DATABASE_URL in CI secrets)");
    }
  });

  test("auth session endpoint returns JSON", async ({ request }) => {
    const res = await request.get("/api/auth/session");
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"] ?? "").toContain("application/json");
    const body = await res.json();
    expect(body === null || typeof body === "object").toBeTruthy();
  });

  test("public health endpoint responds", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  test("stats API requires authentication", async ({ request }) => {
    expect((await request.get("/api/stats")).status()).toBe(401);
  });

  test("stats API returns dashboard data when authenticated", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.request.get("/api/stats");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toMatchObject({
      shippingMethods: expect.any(Number),
      territories: expect.any(Number),
      counties: expect.any(Number),
      zipCodes: expect.any(Number),
      recentLogs: expect.any(Array),
    });
  });

  test("zipcodes API requires authentication", async ({ request }) => {
    expect((await request.get("/api/zipcodes?page=1&limit=5")).status()).toBe(401);
  });

  test("zipcodes API supports pagination when authenticated", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.request.get("/api/zipcodes?page=1&limit=5");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.zips)).toBeTruthy();
    expect(typeof data.total).toBe("number");
  });

  test("search API returns array for short query", async ({ request }) => {
    const res = await request.get("/api/search?q=ny");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test("lookup returns 404 for unknown type", async ({ request }) => {
    const res = await request.get("/api/lookup?type=invalid&q=test");
    expect(res.status()).toBe(404);
  });
});
