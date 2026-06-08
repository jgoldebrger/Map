import area from "@turf/area";
import { feature as turfFeature } from "@turf/helpers";
import type { Polygon } from "geojson";
import type { ZipOverrideRow } from "@/lib/zcta-geo";

export const MONROE_FIPS = "12087";

export const FLORIDA_KEYS_ZIPS = [
  "33001",
  "33036",
  "33037",
  "33040",
  "33042",
  "33043",
  "33050",
  "33051",
  "33070",
] as const;

const FLORIDA_KEYS_ZIP_SET = new Set<string>(FLORIDA_KEYS_ZIPS);

export function isFloridaKeysZip(zip: string | null | undefined): boolean {
  if (!zip) return false;
  return FLORIDA_KEYS_ZIP_SET.has(zip.padStart(5, "0").slice(-5));
}

export type KeysOverrideStyle = {
  color: string;
  territoryName: string;
};

export type MonroeSplit = {
  mainland: GeoJSON.Feature | null;
  keysIslands: GeoJSON.Feature | null;
};

/**
 * Monroe County is a MultiPolygon: one large mainland piece plus Keys islands.
 * County fill should only use mainland; Keys islands get override display color.
 */
export function splitMonroeCounty(county: GeoJSON.Feature): MonroeSplit {
  const geom = county.geometry;
  if (!geom || (geom.type !== "Polygon" && geom.type !== "MultiPolygon")) {
    return { mainland: null, keysIslands: null };
  }

  const rings: Polygon["coordinates"][] =
    geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;

  if (rings.length <= 1) {
    return { mainland: county, keysIslands: null };
  }

  let maxArea = -1;
  let maxIndex = 0;
  for (let i = 0; i < rings.length; i++) {
    const partArea = area(turfFeature({ type: "Polygon", coordinates: rings[i] }));
    if (partArea > maxArea) {
      maxArea = partArea;
      maxIndex = i;
    }
  }

  const properties = county.properties ?? {};
  const mainland: GeoJSON.Feature = {
    type: "Feature",
    properties,
    geometry: { type: "Polygon", coordinates: rings[maxIndex] },
  };

  const keysRings = rings.filter((_, i) => i !== maxIndex);
  if (keysRings.length === 0) {
    return { mainland, keysIslands: null };
  }

  const keysIslands: GeoJSON.Feature = {
    type: "Feature",
    properties,
    geometry:
      keysRings.length === 1
        ? { type: "Polygon", coordinates: keysRings[0] }
        : { type: "MultiPolygon", coordinates: keysRings },
  };

  return { mainland, keysIslands };
}

/** Pick display color when Keys ZIPs share one territory; otherwise use the first override. */
export function resolveKeysOverrideStyle(
  keysOverrides: ZipOverrideRow[],
): KeysOverrideStyle | null {
  if (keysOverrides.length === 0) return null;

  const first = keysOverrides[0];
  const sameTerritory = keysOverrides.every(
    (row) => row.color === first.color && row.territoryName === first.territoryName,
  );

  return {
    color: first.color,
    territoryName: sameTerritory
      ? first.territoryName
      : `${first.territoryName} (+${keysOverrides.length - 1} more)`,
  };
}

let monroeCountyCache: GeoJSON.Feature | null = null;

export async function fetchMonroeCountyFeature(): Promise<GeoJSON.Feature | null> {
  if (monroeCountyCache) return monroeCountyCache;

  const res = await fetch("/geo/us-counties.geojson", { cache: "force-cache" });
  if (!res.ok) return null;

  try {
    const data = (await res.json()) as GeoJSON.FeatureCollection;
    const monroe = data.features.find((f) => {
      const geoid = f.properties?.GEOID ?? f.properties?.geoid;
      return String(geoid).padStart(5, "0").slice(-5) === MONROE_FIPS;
    });
    monroeCountyCache = monroe ?? null;
    return monroeCountyCache;
  } catch {
    return null;
  }
}

let regionCache: GeoJSON.Feature | null = null;

async function loadFloridaKeysRegionFile(): Promise<GeoJSON.Feature | null> {
  if (regionCache) return regionCache;

  const res = await fetch("/geo/regions/florida-keys.geojson", { cache: "force-cache" });
  if (!res.ok) return null;

  try {
    const data = (await res.json()) as GeoJSON.FeatureCollection;
    const feature = data.features[0];
    if (!feature?.geometry) return null;
    regionCache = feature;
    return feature;
  } catch {
    return null;
  }
}

/** Keys display shape: all non-mainland Monroe county islands (covers gaps ZCTAs miss). */
export async function loadFloridaKeysDisplayGeometry(): Promise<GeoJSON.Feature | null> {
  const monroe = await fetchMonroeCountyFeature();
  if (monroe) {
    const { keysIslands } = splitMonroeCounty(monroe);
    if (keysIslands) return keysIslands;
  }
  return loadFloridaKeysRegionFile();
}

export async function loadFloridaKeysRegion(): Promise<GeoJSON.Feature | null> {
  return loadFloridaKeysDisplayGeometry();
}

export function clearFloridaKeysRegionCache(): void {
  regionCache = null;
  monroeCountyCache = null;
}

export function hasFloridaKeysOverrides(overrides: ZipOverrideRow[]): boolean {
  return overrides.some((row) => isFloridaKeysZip(row.zip));
}
