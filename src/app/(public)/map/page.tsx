"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MapLegend } from "@/components/map/MapLegend";
import { CountyPanel } from "@/components/map/CountyPanel";
import { MapSearch } from "@/components/map/MapSearch";
import { useTerritoryAssignments } from "@/hooks/useTerritoryAssignments";
import { useCountyDetail, normalizeFips } from "@/hooks/useCountyDetail";
const MapboxMap = dynamic(
  () => import("@/components/map/MapboxMap").then((m) => m.MapboxMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-muted animate-pulse" /> }
);

export default function PublicMapPage() {
  const { data: assignments = {}, isLoading } = useTerritoryAssignments();
  const [selectedFips, setSelectedFips] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);

  const handleCountyClick = useCallback((fips: string) => {
    setSelectedFips(normalizeFips(fips));
  }, []);

  const {
    data: countyDetail,
    isLoading: countyLoading,
    error: countyError,
  } = useCountyDetail(selectedFips);

  return (
    <div className="h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center">
            <p className="text-muted-foreground">Loading map data...</p>
          </div>
        ) : (
          <MapboxMap
            assignments={assignments}
            mode="view"
            onCountyClick={handleCountyClick}
            onCountyHover={setHoverInfo}
            className="h-full w-full"
          />
        )}

        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <MapSearch />
          {hoverInfo && assignments[hoverInfo] && (
            <div className="rounded-md border bg-white px-3 py-2 text-sm shadow">
              <span className="font-medium">{assignments[hoverInfo].territoryName}</span>
            </div>
          )}
        </div>

        <MapLegend assignments={assignments} className="absolute bottom-4 left-4 z-10 w-56" />

        <CountyPanel
          fips={selectedFips}
          detail={countyDetail}
          isLoading={countyLoading}
          error={countyError}
          onClose={() => setSelectedFips(null)}
        />
      </div>
    </div>
  );
}
