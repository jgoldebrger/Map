import centroid from "@turf/centroid";
import { featureCollection } from "@turf/helpers";
import { fipsFromGeoFeature } from "@/lib/county-geo";
import { FIPS_TO_USPS } from "@/lib/us-states";

/** Manual label anchors for small / dense states (lng, lat). */
const STATE_LABEL_OVERRIDES: Partial<Record<string, [number, number]>> = {
  CT: [-72.7, 41.55],
  DC: [-77.02, 38.91],
  DE: [-75.45, 39.0],
  MA: [-71.85, 42.15],
  MD: [-76.85, 39.05],
  NH: [-71.65, 43.65],
  NJ: [-74.45, 40.1],
  RI: [-71.55, 41.65],
  VT: [-72.7, 44.05],
  WV: [-80.45, 38.85],
};

function stateCodeFromCountyFeature(feature: GeoJSON.Feature): string | null {
  const props = feature.properties ?? {};
  const stateFips = String(props.STATE ?? props.state ?? "").padStart(2, "0");
  return FIPS_TO_USPS[stateFips] ?? null;
}

/**
 * Build point features with USPS state codes for states that have assigned counties.
 */
export function buildStateLabelGeoJson(
  countyFeatures: GeoJSON.Feature[],
  assignedFips: Iterable<string>,
): GeoJSON.FeatureCollection {
  const assignedFipsSet = new Set(
    [...assignedFips].map((f) => f.padStart(5, "0").slice(-5)),
  );
  const assignedStates = new Set<string>();
  const countiesByState = new Map<string, GeoJSON.Feature[]>();

  for (const feature of countyFeatures) {
    const code = stateCodeFromCountyFeature(feature);
    if (!code) continue;

    const fips = fipsFromGeoFeature(feature);
    if (fips && assignedFipsSet.has(fips)) {
      assignedStates.add(code);
    }

    const list = countiesByState.get(code) ?? [];
    list.push(feature);
    countiesByState.set(code, list);
  }

  const features: GeoJSON.Feature[] = [];

  for (const code of [...assignedStates].sort()) {
    const override = STATE_LABEL_OVERRIDES[code];
    if (override) {
      features.push({
        type: "Feature",
        properties: { code },
        geometry: { type: "Point", coordinates: override },
      });
      continue;
    }

    const stateCounties = countiesByState.get(code) ?? [];
    if (stateCounties.length === 0) continue;

    const center = centroid(featureCollection(stateCounties));
    features.push({
      type: "Feature",
      properties: { code },
      geometry: center.geometry,
    });
  }

  return { type: "FeatureCollection", features };
}
