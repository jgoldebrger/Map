type GeoCollection = GeoJSON.FeatureCollection;

export type ZipOverrideRow = {
  zip: string;
  state: string;
  fips: string;
  color: string;
  territoryName: string;
  shippingMethodId: string;
};

const stateCache = new Map<string, GeoCollection>();

async function loadStateGeo(state: string): Promise<GeoCollection | null> {
  const st = state.toUpperCase().slice(0, 2);
  if (stateCache.has(st)) return stateCache.get(st)!;

  const res = await fetch(`/geo/zcta/${st}.json`, { cache: "force-cache" });
  if (!res.ok) return null;

  try {
    const data = (await res.json()) as GeoCollection;
    stateCache.set(st, data);
    return data;
  } catch {
    return null;
  }
}

export async function buildZipOverrideGeoJson(
  overrides: ZipOverrideRow[],
): Promise<GeoJSON.FeatureCollection> {
  if (overrides.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  const byState = new Map<string, Set<string>>();
  const metaByZip = new Map<
    string,
    { fips: string; color: string; territoryName: string; shippingMethodId: string }
  >();

  for (const row of overrides) {
    const zip = row.zip.padStart(5, "0").slice(-5);
    const st = row.state.toUpperCase().slice(0, 2);
    const fips = row.fips.padStart(5, "0").slice(-5);
    if (!byState.has(st)) byState.set(st, new Set());
    byState.get(st)!.add(zip);
    metaByZip.set(zip, {
      fips,
      color: row.color,
      territoryName: row.territoryName,
      shippingMethodId: row.shippingMethodId,
    });
  }

  const features: GeoJSON.Feature[] = [];

  await Promise.all(
    [...byState.entries()].map(async ([state, zips]) => {
      const collection = await loadStateGeo(state);
      if (!collection) return;

      for (const feature of collection.features) {
        const zip = feature.properties?.zip;
        if (typeof zip !== "string" || !zips.has(zip)) continue;
        const meta = metaByZip.get(zip);
        if (!meta) continue;
        features.push({
          type: "Feature",
          properties: {
            zip,
            fips: meta.fips,
            color: meta.color,
            territoryName: meta.territoryName,
            shippingMethodId: meta.shippingMethodId,
          },
          geometry: feature.geometry,
        });
      }
    }),
  );

  return { type: "FeatureCollection", features };
}
