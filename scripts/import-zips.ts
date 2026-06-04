/**
 * Import ZIP codes from HUD USPS crosswalk or Census ZCTA-County CSV.
 * City names come from the zipcodes dataset when not present in the CSV.
 *
 * Usage:
 *   npm run import:zips
 *   ZIP_COUNTY_CSV=./data/zip-county.csv npm run import:zips
 *
 * CSV columns: zip, city, county, state (or ZCTA5,STATE,COUNTY,GEOID,...)
 */
import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { resolveZipCity } from "./lib/zip-cities";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const CENSUS_ZIP_COUNTY_URL =
  "https://www2.census.gov/geo/docs/maps-data/data/rel/zcta_county_rel_10.txt";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else current += c;
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

function countyFipsFromRow(cols: string[], header: string[]): string {
  const geoidIdx = header.findIndex((h) => h === "geoid");
  if (geoidIdx >= 0 && cols[geoidIdx]) {
    return cols[geoidIdx].padStart(5, "0").slice(-5);
  }

  const countyFipsIdx = header.findIndex((h) => h.includes("county") && h.includes("fips"));
  if (countyFipsIdx >= 0 && cols[countyFipsIdx]) {
    return cols[countyFipsIdx].padStart(5, "0").slice(-5);
  }

  const stateIdx = header.findIndex((h) => h === "state");
  const countyIdx = header.findIndex((h) => h === "county");
  if (stateIdx >= 0 && countyIdx >= 0 && cols[stateIdx] && cols[countyIdx]) {
    return `${cols[stateIdx].padStart(2, "0")}${cols[countyIdx].padStart(3, "0")}`;
  }

  return "";
}

async function downloadCensusZipCounty(): Promise<string> {
  console.log("Downloading Census ZCTA-County crosswalk...");
  const res = await fetch(CENSUS_ZIP_COUNTY_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.text();
}

function rowWeight(cols: string[], header: string[]): number {
  for (const key of ["zpopp", "zpop", "poppt", "zpoppct"]) {
    const idx = header.indexOf(key);
    if (idx >= 0 && cols[idx]) {
      const n = Number(cols[idx]);
      if (Number.isFinite(n)) return n;
    }
  }
  return 1;
}

async function main() {
  const prisma = new PrismaClient();

  let csvText: string;
  const customPath = process.env.ZIP_COUNTY_CSV ?? join(root, "data/zip-county.csv");
  if (existsSync(customPath)) {
    console.log(`Reading ${customPath}`);
    csvText = readFileSync(customPath, "utf-8");
  } else {
    csvText = await downloadCensusZipCounty();
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  const header = parseCsvLine(lines[0]).map(normalizeHeader);

  const zipIdx = header.findIndex(
    (h) => h === "zcta5" || h.includes("zcta") || h === "zip" || h === "zipcode",
  );
  const cityIdx = header.findIndex((h) => h === "city" || h.includes("city"));

  if (zipIdx < 0) throw new Error("Could not find ZIP column in CSV");

  const counties = await prisma.county.findMany({
    select: { id: true, fipsCode: true, name: true },
  });
  const fipsMap = new Map(counties.map((c) => [c.fipsCode, c]));

  const pending = new Map<string, { zip: string; city: string; countyId: string; weight: number }>();
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const zip = (cols[zipIdx] ?? "").replace(/\D/g, "").padStart(5, "0").slice(0, 5);
    if (!zip || zip.length !== 5) continue;

    const fips = countyFipsFromRow(cols, header);
    const county = fips ? fipsMap.get(fips) : undefined;
    if (!county) {
      skipped++;
      continue;
    }

    const weight = rowWeight(cols, header);
    const existing = pending.get(zip);
    if (existing && weight <= existing.weight) continue;

    const csvCity = cityIdx >= 0 ? cols[cityIdx] : undefined;
    const city = resolveZipCity(zip, csvCity, county.name);
    if (!city) {
      skipped++;
      continue;
    }

    pending.set(zip, { zip, city, countyId: county.id, weight });
  }

  const rows = [...pending.values()].map(({ zip, city, countyId }) => ({ zip, city, countyId }));
  console.log(`Importing ${rows.length} ZIP codes (${skipped} rows skipped)...`);

  const BATCH = 50;
  let imported = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await prisma.$transaction(
      batch.map((row) =>
        prisma.zipCode.upsert({
          where: { zip: row.zip },
          create: row,
          update: { city: row.city, countyId: row.countyId },
        }),
      ),
    );
    imported += batch.length;
    if (imported % 500 === 0 || imported === rows.length) {
      process.stdout.write(`\r  ${imported} / ${rows.length}`);
    }
  }

  console.log(`\nDone. ${imported} ZIP codes imported, ${skipped} rows skipped.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
