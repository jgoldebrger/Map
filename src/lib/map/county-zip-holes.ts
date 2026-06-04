import buffer from "@turf/buffer";
import difference from "@turf/difference";
import { feature as turfFeature, featureCollection } from "@turf/helpers";
import union from "@turf/union";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { fipsFromGeoFeature } from "@/lib/county-geo";

type PolygonFeature = Feature<Polygon | MultiPolygon>;

/** Widen hole geometry so county fill does not bleed between adjacent ZCTA islands. */
const HOLE_BUFFER_KM = 0.1;

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

/** Union override ZIP shapes (+ buffer) for hole punching; display layers keep exact ZCTA. */
function buildHoleGeometry(zipPolygons: PolygonFeature[]): PolygonFeature | null {
  if (zipPolygons.length === 0) return null;

  const hole: PolygonFeature | null =
    zipPolygons.length === 1
      ? zipPolygons[0]
      : union(featureCollection(zipPolygons));
  if (!hole) return zipPolygons[0] ?? null;

  try {
    const buffered = buffer(hole, HOLE_BUFFER_KM, { units: "kilometers" });
    return (buffered as PolygonFeature | undefined) ?? hole;
  } catch {
    return hole;
  }
}

function subtractFromCounty(
  countyFeature: PolygonFeature,
  hole: PolygonFeature,
  county: GeoJSON.Feature,
): GeoJSON.Feature {
  const result = difference(
    featureCollection([countyFeature, hole]) as FeatureCollection<Polygon | MultiPolygon>,
  );
  if (!result) return county;
  return {
    type: "Feature",
    properties: county.properties ?? {},
    geometry: result.geometry,
  };
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

  const hole = buildHoleGeometry(zipPolygons);
  if (!hole) return county;

  try {
    return subtractFromCounty(countyFeature, hole, county);
  } catch {
    try {
      const result = difference(
        featureCollection([countyFeature, ...zipPolygons]) as FeatureCollection<
          Polygon | MultiPolygon
        >,
      );
      if (!result) return county;
      return {
        type: "Feature",
        properties: county.properties ?? {},
        geometry: result.geometry,
      };
    } catch {
      return county;
    }
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
