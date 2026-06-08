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

let regionCache: GeoJSON.Feature | null = null;

export async function loadFloridaKeysRegion(): Promise<GeoJSON.Feature | null> {
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

export function clearFloridaKeysRegionCache(): void {
  regionCache = null;
}

export function hasFloridaKeysOverrides(overrides: ZipOverrideRow[]): boolean {
  return overrides.some((row) => isFloridaKeysZip(row.zip));
}
