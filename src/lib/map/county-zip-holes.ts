import difference from "@turf/difference";
import { feature as turfFeature, featureCollection } from "@turf/helpers";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { fipsFromGeoFeature } from "@/lib/county-geo";

type PolygonFeature = Feature<Polygon | MultiPolygon>;

function isPolygonGeometry(
  geometry: GeoJSON.Geometry | null | undefined,
): geometry is Polygon | MultiPolygon {
  return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";
}

function asPolygonFeature(feature: GeoJSON.Feature): PolygonFeature | null {
  if (!isPolygonGeometry(feature.geometry)) return null;
  return turfFeature(feature.geometry, feature.properties ?? {}) as PolygonFeature;
}

function normalizeFips(fips: string): string {
  return fips.padStart(5, "0").slice(-5);
}

function punchCountyHoles(
  county: GeoJSON.Feature,
  zipFeatures: GeoJSON.Feature[],
): GeoJSON.Feature {
  if (zipFeatures.length === 0) return county;

  const countyFeature = asPolygonFeature(county);
  if (!countyFeature) return county;

  const zipPolygons = zipFeatures
    .map((z) => asPolygonFeature(z))
    .filter((z): z is PolygonFeature => z !== null);
  if (zipPolygons.length === 0) return county;

  try {
    const result = difference(
      featureCollection([countyFeature, ...zipPolygons]) as FeatureCollection<
        Polygon | MultiPolygon
      >,
    );
    if (!result) {
      return county;
    }
    return {
      type: "Feature",
      properties: county.properties ?? {},
      geometry: result.geometry,
    };
  } catch {
    return county;
  }
}

/** Cut override ZIP areas out of county polygons so county fill does not show underneath. */
export function applyZipHolesToCounties(
  counties: GeoJSON.FeatureCollection,
  zipOverrides: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
  if (zipOverrides.features.length === 0) {
    return counties;
  }

  const zipsByFips = new Map<string, GeoJSON.Feature[]>();
  for (const zipFeature of zipOverrides.features) {
    const rawFips = zipFeature.properties?.fips;
    if (typeof rawFips !== "string" || !rawFips) continue;
    const fips = normalizeFips(rawFips);
    const list = zipsByFips.get(fips) ?? [];
    list.push(zipFeature);
    zipsByFips.set(fips, list);
  }

  if (zipsByFips.size === 0) {
    return counties;
  }

  const features = counties.features.map((county) => {
    const fips = fipsFromGeoFeature(county);
    if (!fips) return county;
    const zipFeatures = zipsByFips.get(fips);
    if (!zipFeatures?.length) return county;
    return punchCountyHoles(county, zipFeatures);
  });

  return { type: "FeatureCollection", features };
}

let baseCountiesCache: GeoJSON.FeatureCollection | null = null;

export async function fetchBaseCountiesGeoJson(): Promise<GeoJSON.FeatureCollection> {
  if (baseCountiesCache) return baseCountiesCache;
  const res = await fetch("/geo/us-counties.geojson", { cache: "force-cache" });
  if (!res.ok) throw new Error("Failed to load county boundaries");
  baseCountiesCache = (await res.json()) as GeoJSON.FeatureCollection;
  return baseCountiesCache;
}

export function clearBaseCountiesCache(): void {
  baseCountiesCache = null;
}
