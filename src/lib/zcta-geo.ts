import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ZCTA_DIR = join(process.cwd(), "public/geo/zcta");

type GeoCollection = GeoJSON.FeatureCollection;

const stateCache = new Map<string, GeoCollection>();

function loadStateGeo(state: string): GeoCollection | null {
  const st = state.toUpperCase().slice(0, 2);
  if (stateCache.has(st)) return stateCache.get(st)!;

  const path = join(ZCTA_DIR, `${st}.json`);
  if (!existsSync(path)) return null;

  try {
    const data = JSON.parse(readFileSync(path, "utf8")) as GeoCollection;
    stateCache.set(st, data);
    return data;
  } catch {
    return null;
  }
}

export function buildZipOverrideGeoJson(
  overrides: { zip: string; state: string; color: string; territoryName: string }[],
): GeoJSON.FeatureCollection {
  if (overrides.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  const byState = new Map<string, Set<string>>();
  const metaByZip = new Map<string, { color: string; territoryName: string }>();

  for (const row of overrides) {
    const zip = row.zip.padStart(5, "0").slice(-5);
    const st = row.state.toUpperCase().slice(0, 2);
    if (!byState.has(st)) byState.set(st, new Set());
    byState.get(st)!.add(zip);
    metaByZip.set(zip, { color: row.color, territoryName: row.territoryName });
  }

  const features: GeoJSON.Feature[] = [];

  for (const [state, zips] of byState) {
    const collection = loadStateGeo(state);
    if (!collection) continue;

    for (const feature of collection.features) {
      const zip = feature.properties?.zip;
      if (typeof zip !== "string" || !zips.has(zip)) continue;
      const meta = metaByZip.get(zip);
      if (!meta) continue;
      features.push({
        type: "Feature",
        properties: {
          zip,
          color: meta.color,
          territoryName: meta.territoryName,
        },
        geometry: feature.geometry,
      });
    }
  }

  return { type: "FeatureCollection", features };
}

export function zctaDataAvailable(states: string[]): boolean {
  return states.some((s) => existsSync(join(ZCTA_DIR, `${s.toUpperCase().slice(0, 2)}.json`)));
}
