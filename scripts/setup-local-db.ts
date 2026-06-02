/**
 * Download and start embedded PostgreSQL (no Docker/winget required).
 * Creates database "sip" and runs migrations + seed.
 *
 * Usage: npm run db:local
 */
import EmbeddedPostgres from "embedded-postgres";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(process.env.USERPROFILE ?? root, ".sip-pgdata");

const PORT = Number(process.env.PGPORT ?? 5432);
const USER = "sip";
const PASSWORD = "sip";
const DATABASE = "sip";

async function main() {
  console.log("Starting embedded PostgreSQL (first run downloads binaries)...");
  mkdirSync(dataDir, { recursive: true });

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: PORT,
    user: USER,
    password: PASSWORD,
    persistent: true,
  });

  await pg.initialise();
  await pg.start();
  console.log(`PostgreSQL running on localhost:${PORT}`);

  try {
    await pg.createDatabase(DATABASE);
    console.log(`Created database "${DATABASE}"`);
  } catch {
    console.log(`Database "${DATABASE}" already exists`);
  }

  const databaseUrl = `postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}?schema=public`;
  process.env.DATABASE_URL = databaseUrl;

  console.log("Running migrations...");
  execSync("npx prisma migrate deploy", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  console.log("Seeding database...");
  execSync("npm run db:seed", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  console.log("\n--- Connected ---");
  console.log(`DATABASE_URL="${databaseUrl}"`);
  console.log("\nAdd the line above to your .env file, then run: npm run dev");
  console.log("\nPostgreSQL will keep running until you stop this process (Ctrl+C).");
  console.log("Or run: npm run db:local:stop");

  // Keep process alive so server stays up
  process.on("SIGINT", async () => {
    console.log("\nStopping PostgreSQL...");
    await pg.stop();
    process.exit(0);
  });

  // Write connection hint for other scripts
  const envHint = join(root, ".pgdata-connection");
  const { writeFileSync } = await import("node:fs");
  writeFileSync(envHint, databaseUrl, "utf-8");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
