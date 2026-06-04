/**
 * Download per-state ZCTA GeoJSON for map ZIP override layers.
 * Source: OpenDataDE/state-zip-code-GeoJSON (minified files).
 *
 * Usage:
 *   npm run import:zcta              # all states (~100MB total)
 *   npm run import:zcta -- --state FL
 */
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/geo/zcta");
const BASE =
  "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master";

const STATE_FILES: Record<string, string> = {
  AL: "al_alabama_zip_codes_geo.min.json",
  AK: "ak_alaska_zip_codes_geo.min.json",
  AZ: "az_arizona_zip_codes_geo.min.json",
  AR: "ar_arkansas_zip_codes_geo.min.json",
  CA: "ca_california_zip_codes_geo.min.json",
  CO: "co_colorado_zip_codes_geo.min.json",
  CT: "ct_connecticut_zip_codes_geo.min.json",
  DE: "de_delaware_zip_codes_geo.min.json",
  DC: "dc_district_of_columbia_zip_codes_geo.min.json",
  FL: "fl_florida_zip_codes_geo.min.json",
  GA: "ga_georgia_zip_codes_geo.min.json",
  HI: "hi_hawaii_zip_codes_geo.min.json",
  ID: "id_idaho_zip_codes_geo.min.json",
  IL: "il_illinois_zip_codes_geo.min.json",
  IN: "in_indiana_zip_codes_geo.min.json",
  IA: "ia_iowa_zip_codes_geo.min.json",
  KS: "ks_kansas_zip_codes_geo.min.json",
  KY: "ky_kentucky_zip_codes_geo.min.json",
  LA: "la_louisiana_zip_codes_geo.min.json",
  ME: "me_maine_zip_codes_geo.min.json",
  MD: "md_maryland_zip_codes_geo.min.json",
  MA: "ma_massachusetts_zip_codes_geo.min.json",
  MI: "mi_michigan_zip_codes_geo.min.json",
  MN: "mn_minnesota_zip_codes_geo.min.json",
  MS: "ms_mississippi_zip_codes_geo.min.json",
  MO: "mo_missouri_zip_codes_geo.min.json",
  MT: "mt_montana_zip_codes_geo.min.json",
  NE: "ne_nebraska_zip_codes_geo.min.json",
  NV: "nv_nevada_zip_codes_geo.min.json",
  NH: "nh_new_hampshire_zip_codes_geo.min.json",
  NJ: "nj_new_jersey_zip_codes_geo.min.json",
  NM: "nm_new_mexico_zip_codes_geo.min.json",
  NY: "ny_new_york_zip_codes_geo.min.json",
  NC: "nc_north_carolina_zip_codes_geo.min.json",
  ND: "nd_north_dakota_zip_codes_geo.min.json",
  OH: "oh_ohio_zip_codes_geo.min.json",
  OK: "ok_oklahoma_zip_codes_geo.min.json",
  OR: "or_oregon_zip_codes_geo.min.json",
  PA: "pa_pennsylvania_zip_codes_geo.min.json",
  RI: "ri_rhode_island_zip_codes_geo.min.json",
  SC: "sc_south_carolina_zip_codes_geo.min.json",
  SD: "sd_south_dakota_zip_codes_geo.min.json",
  TN: "tn_tennessee_zip_codes_geo.min.json",
  TX: "tx_texas_zip_codes_geo.min.json",
  UT: "ut_utah_zip_codes_geo.min.json",
  VT: "vt_vermont_zip_codes_geo.min.json",
  VA: "va_virginia_zip_codes_geo.min.json",
  WA: "wa_washington_zip_codes_geo.min.json",
  WV: "wv_west_virginia_zip_codes_geo.min.json",
  WI: "wi_wisconsin_zip_codes_geo.min.json",
  WY: "wy_wyoming_zip_codes_geo.min.json",
};

type GeoFeature = GeoJSON.Feature;
type GeoCollection = GeoJSON.FeatureCollection;

function zipFromProps(props: GeoJSON.GeoJsonProperties): string | null {
  if (!props) return null;
  const raw =
    props.ZCTA5CE10 ??
    props.ZCTA5CE20 ??
    props.ZIP ??
    props.zip ??
    props.GEOID10 ??
    props.GEOID;
  if (raw == null || raw === "") return null;
  const zip = String(raw).replace(/\D/g, "").slice(0, 5).padStart(5, "0");
  return zip.length === 5 ? zip : null;
}

function normalizeCollection(data: GeoCollection): GeoCollection {
  const features: GeoFeature[] = [];
  for (const feature of data.features ?? []) {
    if (!feature.geometry) continue;
    const zip = zipFromProps(feature.properties);
    if (!zip) continue;
    features.push({
      type: "Feature",
      properties: { zip },
      geometry: feature.geometry,
    });
  }
  return { type: "FeatureCollection", features };
}

async function importState(state: string): Promise<number> {
  const file = STATE_FILES[state];
  if (!file) throw new Error(`Unknown state: ${state}`);

  const url = `${BASE}/${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${state}: ${res.status}`);

  const raw = (await res.json()) as GeoCollection;
  const normalized = normalizeCollection(raw);
  const outPath = join(outDir, `${state}.json`);
  writeFileSync(outPath, JSON.stringify(normalized));
  return normalized.features.length;
}

async function main() {
  const stateArg = process.argv.find((a) => a.startsWith("--state="))?.split("=")[1]?.toUpperCase();
  const states = stateArg ? [stateArg] : Object.keys(STATE_FILES);

  mkdirSync(outDir, { recursive: true });

  let total = 0;
  for (const state of states) {
    if (!STATE_FILES[state]) {
      console.warn(`Skipping unknown state: ${state}`);
      continue;
    }
    process.stdout.write(`  ${state}…`);
    const count = await importState(state);
    total += count;
    console.log(` ${count} ZIPs`);
  }

  console.log(`Done. ${total} ZIP boundaries in ${outDir}`);
  if (!stateArg) {
    console.log("Tip: commit public/geo/zcta/ or run this on your deploy host.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
