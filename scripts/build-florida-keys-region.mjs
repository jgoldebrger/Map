/**
 * Build a unified Florida Keys region polygon for map display.
 * Union 9 Keys ZCTAs, buffer to close inter-island channels, simplify lightly.
 *
 * Usage: node scripts/build-florida-keys-region.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import buffer from "@turf/buffer";
import { featureCollection } from "@turf/helpers";
import simplify from "@turf/simplify";
import union from "@turf/union";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const FLORIDA_KEYS_ZIPS = [
  "33001",
  "33036",
  "33037",
  "33040",
  "33042",
  "33043",
  "33050",
  "33051",
  "33070",
];

const BUFFER_KM = 1.5;
const SIMPLIFY_TOLERANCE = 0.0005;

const flPath = path.join(root, "public/geo/zcta/FL.json");
const outDir = path.join(root, "public/geo/regions");
const outPath = path.join(outDir, "florida-keys.geojson");

const fl = JSON.parse(fs.readFileSync(flPath, "utf8"));
const zipSet = new Set(FLORIDA_KEYS_ZIPS);
const features = fl.features.filter((f) => zipSet.has(f.properties?.zip));

if (features.length !== FLORIDA_KEYS_ZIPS.length) {
  const found = features.map((f) => f.properties.zip);
  const missing = FLORIDA_KEYS_ZIPS.filter((z) => !found.includes(z));
  console.error("Missing ZCTA features:", missing);
  process.exit(1);
}

let merged = features.length === 1 ? features[0] : union(featureCollection(features));
if (!merged) {
  console.error("Union failed");
  process.exit(1);
}

const buffered = buffer(merged, BUFFER_KM, { units: "kilometers" });
if (!buffered) {
  console.error("Buffer failed");
  process.exit(1);
}

const simplified = simplify(buffered, { tolerance: SIMPLIFY_TOLERANCE, highQuality: true });

const output = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        region: "florida-keys",
        fips: "12087",
        zips: FLORIDA_KEYS_ZIPS,
      },
      geometry: simplified.geometry,
    },
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output));
console.log(`Wrote ${outPath} (${features.length} ZCTAs unioned, buffer ${BUFFER_KM}km)`);
