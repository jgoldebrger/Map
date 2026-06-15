import { buildZipOverrideGeoJson, type ZipOverrideRow } from "@/lib/zcta-geo";
import {
  isFloridaKeysZip,
  loadFloridaKeysDisplayGeometry,
  MONROE_FIPS,
  resolveKeysOverrideStyle,
} from "@/lib/map/florida-keys";

export type MapOverrideGeoJson = {
  display: GeoJSON.FeatureCollection;
  hit: GeoJSON.FeatureCollection;
};

export async function buildMapOverrideGeoJson(
  overrides: ZipOverrideRow[],
): Promise<MapOverrideGeoJson> {
  const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

  if (overrides.length === 0) {
    return { display: empty, hit: empty };
  }

  const hit = await buildZipOverrideGeoJson(overrides);
  const keysOverrides = overrides.filter((row) => isFloridaKeysZip(row.zip));
  const displayFeatures = hit.features.filter((f) => !isFloridaKeysZip(f.properties?.zip));

  if (keysOverrides.length > 0) {
    const style = resolveKeysOverrideStyle(keysOverrides);
    const region = await loadFloridaKeysDisplayGeometry();

    if (region && style) {
      displayFeatures.push({
        type: "Feature",
        properties: {
          region: "florida-keys",
          fips: MONROE_FIPS,
          color: style.color,
          territoryName: style.territoryName,
          shippingMethodId: style.shippingMethodId,
        },
        geometry: region.geometry,
      });
    } else {
      displayFeatures.push(
        ...hit.features.filter((f) => isFloridaKeysZip(f.properties?.zip)),
      );
    }
  }

  return {
    display: { type: "FeatureCollection", features: displayFeatures },
    hit,
  };
}
