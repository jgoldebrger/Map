import { useQuery, useQueryClient } from "@tanstack/react-query";

export type ZipOverrideGeoJson = GeoJSON.FeatureCollection & {
  meta?: {
    overrideCount: number;
    renderedCount: number;
    zctaAvailable: boolean;
  };
};

export async function fetchZipOverrideGeoJson(): Promise<ZipOverrideGeoJson> {
  const res = await fetch("/api/zipcodes/assignments/geojson", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load ZIP override map data");
  return res.json();
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
