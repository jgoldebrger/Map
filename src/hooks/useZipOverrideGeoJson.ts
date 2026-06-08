import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { buildMapOverrideGeoJson } from "@/lib/map/build-map-override-geojson";
import { hasFloridaKeysOverrides } from "@/lib/map/florida-keys";
import type { ZipOverrideRow } from "@/lib/zcta-geo";

export type ZipOverrideGeoJson = {
  display: GeoJSON.FeatureCollection;
  hit: GeoJSON.FeatureCollection;
  meta?: {
    overrideCount: number;
    renderedDisplayCount: number;
    renderedHitCount: number;
    usesFloridaKeysRegion: boolean;
  };
};

async function fetchZipOverrideGeoJson(): Promise<ZipOverrideGeoJson> {
  const res = await fetch("/api/zipcodes/assignments/geojson", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load ZIP override map data");

  const { overrides } = (await res.json()) as { overrides: ZipOverrideRow[] };
  const { display, hit } = await buildMapOverrideGeoJson(overrides);

  return {
    display,
    hit,
    meta: {
      overrideCount: overrides.length,
      renderedDisplayCount: display.features.length,
      renderedHitCount: hit.features.length,
      usesFloridaKeysRegion: hasFloridaKeysOverrides(overrides),
    },
  };
}

export function zipOverrideGeoRevision(data: ZipOverrideGeoJson | null | undefined): string {
  const count = data?.meta?.overrideCount ?? data?.display?.features?.length ?? 0;
  if (!data?.display?.features?.length && !data?.hit?.features?.length) {
    return `empty:${count}`;
  }
  const displayKey = data.display.features
    .map((f) => `${f.properties?.zip ?? f.properties?.region}:${f.properties?.color}`)
    .sort()
    .join("|");
  const hitKey = data.hit.features
    .map((f) => `${f.properties?.zip}:${f.properties?.color}`)
    .sort()
    .join("|");
  return `${count}:${displayKey}::${hitKey}`;
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
