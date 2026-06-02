/**
 * One-shot: start embedded Postgres, migrate, seed, stop.
 * Usage: npm run db:init
 */
import EmbeddedPostgres from "embedded-postgres";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
// Avoid spaces in path (e.g. "Online Map") — breaks initdb on Windows
const dataDir = join(process.env.USERPROFILE ?? root, ".sip-pgdata");
const envPath = join(root, ".env");

const PORT = Number(process.env.PGPORT ?? 5432);
const USER = "sip";
const PASSWORD = "sip";
const DATABASE = "sip";

async function main() {
  console.log("Initializing embedded PostgreSQL...");
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

  try {
    await pg.createDatabase(DATABASE);
  } catch {
    /* exists */
  }

  const databaseUrl = `postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}?schema=public`;

  execSync("npx prisma migrate deploy", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  execSync("npm run db:seed", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  // Update .env DATABASE_URL
  if (existsSync(envPath)) {
    let env = readFileSync(envPath, "utf-8");
    if (env.includes("DATABASE_URL=")) {
      env = env.replace(/DATABASE_URL=.*/m, `DATABASE_URL="${databaseUrl}"`);
    } else {
      env += `\nDATABASE_URL="${databaseUrl}"\n`;
    }
    writeFileSync(envPath, env, "utf-8");
    console.log("Updated .env with DATABASE_URL");
  }

  await pg.stop();
  console.log("Done. Start the database with: npm run db:local");
  console.log(`Connection: ${databaseUrl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
