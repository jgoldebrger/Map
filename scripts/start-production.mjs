/**
 * Start the Next.js standalone server with static assets (CSS/JS) copied in.
 * Required because `output: "standalone"` does not bundle .next/static or public/.
 */
import { cpSync, existsSync, mkdirSync } from "fs";
import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standaloneDir = join(root, ".next", "standalone");

if (!existsSync(join(standaloneDir, "server.js"))) {
  console.error("Missing .next/standalone/server.js — run: npm run build");
  process.exit(1);
}

cpSync(join(root, "public"), join(standaloneDir, "public"), { recursive: true });
mkdirSync(join(standaloneDir, ".next"), { recursive: true });
cpSync(join(root, ".next", "static"), join(standaloneDir, ".next", "static"), {
  recursive: true,
});

console.log("Starting production server (standalone)…");

const child = spawn("node", ["server.js"], {
  cwd: standaloneDir,
  stdio: "inherit",
  env: {
    ...process.env,
    HOSTNAME: process.env.HOSTNAME ?? "0.0.0.0",
    PORT: process.env.PORT ?? "3000",
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
