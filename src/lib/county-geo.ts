import { bbox } from "@turf/bbox";
import { featureCollection } from "@turf/helpers";
import { USPS_TO_FIPS } from "@/lib/us-states";

export function normalizeFips(raw: string | number | undefined | null): string | null {
  if (raw == null || raw === "") return null;
  const fips = String(raw).padStart(5, "0").slice(-5);
  return fips === "00000" ? null : fips;
}

export function fipsFromGeoFeature(feature: GeoJSON.Feature): string | null {
  const props = feature.properties ?? {};
  const geoid = props.GEOID ?? props.geoid;
  if (geoid != null && geoid !== "") return normalizeFips(String(geoid));

  const state = props.STATE ?? props.state;
  const county = props.COUNTY ?? props.county;
  if (state != null && county != null) {
    return `${String(state).padStart(2, "0")}${String(county).padStart(3, "0")}`;
  }

  const geoId = props.GEO_ID ?? "";
  const match = String(geoId).match(/US(\d{5})$/);
  return match ? match[1] : null;
}

/** All county FIPS codes in a USPS state from GeoJSON features */
export function countyFipsInState(
  features: GeoJSON.Feature[],
  stateAbbr: string,
): string[] {
  const prefix = USPS_TO_FIPS[stateAbbr.toUpperCase()];
  if (!prefix) return [];

  const seen = new Set<string>();
  for (const feature of features) {
    const fips = fipsFromGeoFeature(feature);
    if (fips?.startsWith(prefix)) seen.add(fips);
  }
  return [...seen];
}

/** Features belonging to a USPS state */
export function featuresInState(
  features: GeoJSON.Feature[],
  stateAbbr: string,
): GeoJSON.Feature[] {
  const prefix = USPS_TO_FIPS[stateAbbr.toUpperCase()];
  if (!prefix) return [];
  return features.filter((f) => {
    const fips = fipsFromGeoFeature(f);
    return fips?.startsWith(prefix);
  });
}

export function boundsForFeatures(
  features: GeoJSON.Feature[],
): [[number, number], [number, number]] | null {
  if (features.length === 0) return null;
  const [minX, minY, maxX, maxY] = bbox(featureCollection(features));
  return [
    [minX, minY],
    [maxX, maxY],
  ];
}
