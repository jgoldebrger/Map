import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
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
  const count = data?.meta?.overrideCount ?? data?.features?.length ?? 0;
  if (!data?.features?.length) return `empty:${count}`;
  return `${count}:${data.features
    .map((f) => `${f.properties?.zip}:${f.properties?.color}`)
    .sort()
    .join("|")}`;
}

export function useZipOverrideGeoJson() {
  return useQuery<ZipOverrideGeoJson>({
    queryKey: ["zip-override-geojson"],
    queryFn: fetchZipOverrideGeoJson,
    staleTime: 0,
    structuralSharing: false,
    refetchOnWindowFocus: true,
  });
}

export async function refreshZipOverrideGeoJson(qc: QueryClient) {
  await qc.refetchQueries({ queryKey: ["zip-override-geojson"] });
}

export function useRefreshZipOverrideGeoJson() {
  const qc = useQueryClient();
  return useCallback(() => refreshZipOverrideGeoJson(qc), [qc]);
}

export function useInvalidateZipOverrideGeoJson() {
  const refresh = useRefreshZipOverrideGeoJson();
  return refresh;
}
