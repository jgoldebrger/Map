import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const FLAG_FILE = join(__dirname, ".db-ready");

export function setDbReady(ready: boolean) {
  writeFileSync(FLAG_FILE, ready ? "1" : "0", "utf-8");
}

export function isDbReady(): boolean {
  if (!existsSync(FLAG_FILE)) return false;
  return readFileSync(FLAG_FILE, "utf-8").trim() === "1";
}
