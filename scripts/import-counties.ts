/**
 * Import US counties from Plotly FIPS GeoJSON into PostgreSQL.
 * Counties are imported without territory assignment — assign in Admin → Map.
 *
 * Usage: npm run import:counties
 */
import { config } from "dotenv";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const geoOut = join(root, "public/geo/us-counties.geojson");

const US_COUNTIES_URL =
  "https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json";

/** Census state FIPS → USPS abbreviation */
const FIPS_TO_USPS: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
  "60": "AS",
  "66": "GU",
  "69": "MP",
  "72": "PR",
  "78": "VI",
};

type GeoFeature = {
  type: "Feature";
  properties: Record<string, string>;
  geometry: { type: string; coordinates: unknown };
};

type GeoCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

function fipsFromProps(props: Record<string, string>): string {
  const geoid = props.GEOID ?? props.fips;
  if (geoid) return String(geoid).padStart(5, "0").slice(-5);

  const state = props.STATE ?? props.state;
  const county = props.COUNTY ?? props.county;
  if (state != null && county != null) {
    return `${String(state).padStart(2, "0")}${String(county).padStart(3, "0")}`;
  }

  const geoId = props.GEO_ID ?? "";
  const match = geoId.match(/US(\d{5})$/);
  return match ? match[1] : "";
}

function parseCounty(props: Record<string, string>): { fips: string; name: string; state: string } | null {
  const fips = fipsFromProps(props);
  if (!fips || fips === "00000") return null;

  const stateFips = fips.slice(0, 2);
  const state = FIPS_TO_USPS[stateFips];
  if (!state) return null;

  const rawName = props.NAME ?? props.name ?? "";
  const name = rawName.replace(/ County$/i, "").trim() || rawName;
  return { fips, name, state };
}

function enrichGeoJson(geojson: GeoCollection): void {
  for (const feature of geojson.features) {
    const parsed = parseCounty(feature.properties);
    if (parsed) {
      feature.properties.GEOID = parsed.fips;
    }
  }
}

async function main() {
  const prisma = new PrismaClient();

  console.log("Fetching US county GeoJSON...");
  const res = await fetch(US_COUNTIES_URL);
  if (!res.ok) throw new Error(`Failed to fetch counties: ${res.status}`);
  const geojson = (await res.json()) as GeoCollection;

  enrichGeoJson(geojson);
  mkdirSync(join(root, "public/geo"), { recursive: true });
  writeFileSync(geoOut, JSON.stringify(geojson));
  console.log(`Wrote ${geoOut} (${geojson.features.length} features)`);

  const rows = geojson.features
    .map((f) => parseCounty(f.properties))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  console.log(`Importing ${rows.length} counties to database...`);
  const BATCH = 25;
  let processed = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await prisma.$transaction(
      batch.map((row) =>
        prisma.county.upsert({
          where: { fipsCode: row.fips },
          create: {
            fipsCode: row.fips,
            name: row.name,
            state: row.state,
            geoJsonId: row.fips,
          },
          update: { name: row.name, state: row.state, geoJsonId: row.fips },
        }),
      ),
    );
    processed += batch.length;
    process.stdout.write(`\r  ${processed} / ${rows.length}`);
  }

  const total = await prisma.county.count();
  const assigned = await prisma.countyAssignment.count();
  console.log(`\nDone. ${total} counties in database (${assigned} with territory assignments).`);
  console.log(`GeoJSON at public/geo/us-counties.geojson`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
