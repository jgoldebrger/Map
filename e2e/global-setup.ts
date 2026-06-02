import { config } from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { setDbReady } from "./db-ready";

const DB_PROBE_MS = 10_000;

export default async function globalSetup() {
  config({ path: resolve(process.cwd(), ".env") });

  const prisma = new PrismaClient();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`database probe timed out after ${DB_PROBE_MS}ms`)), DB_PROBE_MS),
      ),
    ]);
    setDbReady(true);
    console.log("E2E: database connected");
  } catch (err) {
    setDbReady(false);
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`E2E: database not available — API and auth tests will be skipped (${msg})`);
  } finally {
    await prisma.$disconnect();
  }
}
