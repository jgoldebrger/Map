import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buildZipOverrideGeoJson, type ZipOverrideRow } from "@/lib/zcta-geo";

export type ZipOverrideGeoJson = GeoJSON.FeatureCollection & {
  meta?: {
    overrideCount: number;
    renderedCount: number;
  };
};

async function fetchZipOverrideGeoJson(): Promise<ZipOverrideGeoJson> {
  const res = await fetch("/api/zipcodes/assignments/geojson", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load ZIP override map data");

  const { overrides } = (await res.json()) as { overrides: ZipOverrideRow[] };
  const geojson = await buildZipOverrideGeoJson(overrides);

  return {
    ...geojson,
    meta: {
      overrideCount: overrides.length,
      renderedCount: geojson.features.length,
    },
  };
}

export function zipOverrideGeoRevision(data: ZipOverrideGeoJson | undefined): string {
  if (!data?.features?.length) return "";
  return data.features
    .map((f) => `${f.properties?.zip}:${f.properties?.color}`)
    .sort()
    .join("|");
}

export function useZipOverrideGeoJson() {
  return useQuery<ZipOverrideGeoJson>({
    queryKey: ["zip-override-geojson"],
    queryFn: fetchZipOverrideGeoJson,
    staleTime: 0,
  });
}

export function useInvalidateZipOverrideGeoJson() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["zip-override-geojson"] });
}
