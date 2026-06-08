/**
 * Build a unified Florida Keys region polygon for map display.
 * Union 9 Keys ZCTAs, buffer to close inter-island channels, clip to Monroe County.
 *
 * Usage: node scripts/build-florida-keys-region.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import area from "@turf/area";
import buffer from "@turf/buffer";
import intersect from "@turf/intersect";
import { featureCollection } from "@turf/helpers";
import simplify from "@turf/simplify";
import union from "@turf/union";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const MONROE_FIPS = "12087";

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

const BUFFER_KM = 1;
const SIMPLIFY_TOLERANCE = 0.0002;

const flPath = path.join(root, "public/geo/zcta/FL.json");
const countiesPath = path.join(root, "public/geo/us-counties.geojson");
const outDir = path.join(root, "public/geo/regions");
const outPath = path.join(outDir, "florida-keys.geojson");

const fl = JSON.parse(fs.readFileSync(flPath, "utf8"));
const counties = JSON.parse(fs.readFileSync(countiesPath, "utf8"));
const monroe = counties.features.find(
  (f) => String(f.properties.GEOID ?? f.properties.fips) === MONROE_FIPS,
);
if (!monroe) {
  console.error("Monroe County not found in us-counties.geojson");
  process.exit(1);
}

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

const clipped = intersect(featureCollection([monroe, buffered]));
if (!clipped) {
  console.error("Clip to Monroe County failed");
  process.exit(1);
}

const simplified = simplify(clipped, { tolerance: SIMPLIFY_TOLERANCE, highQuality: true });

const output = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        region: "florida-keys",
        fips: MONROE_FIPS,
        zips: FLORIDA_KEYS_ZIPS,
      },
      geometry: simplified.geometry,
    },
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output));

const miami = counties.features.find(
  (f) => String(f.properties.GEOID ?? f.properties.fips) === "12086",
);
const spill = intersect(featureCollection([miami, simplified]));
const spillKm2 = spill ? (area(spill) / 1e6).toFixed(2) : "0";
console.log(
  `Wrote ${outPath} (${features.length} ZCTAs, buffer ${BUFFER_KM}km, clipped to Monroe, Miami-Dade spill ${spillKm2} km²)`,
);
