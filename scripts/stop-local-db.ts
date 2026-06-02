import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(process.env.USERPROFILE ?? root, ".sip-pgdata");

async function main() {
  if (!existsSync(dataDir)) {
    console.log("No local database data found (.pgdata)");
    return;
  }

  const EmbeddedPostgres = (await import("embedded-postgres")).default;
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: Number(process.env.PGPORT ?? 5432),
    user: "sip",
    password: "sip",
    persistent: true,
  });

  try {
    await pg.initialise();
    await pg.stop();
    console.log("Embedded PostgreSQL stopped.");
  } catch (e) {
    console.log("Stop via Task Manager if postgres.exe is still running.", e);
    try {
      execSync('taskkill /F /IM postgres.exe 2>nul', { stdio: "ignore" });
    } catch {
      /* ignore */
    }
  }
}

main();
