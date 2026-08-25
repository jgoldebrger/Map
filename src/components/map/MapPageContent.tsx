"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MapLegend } from "@/components/map/MapLegend";
import { CountyPanel } from "@/components/map/CountyPanel";
import { ZipDetailPanel } from "@/components/map/ZipDetailPanel";
import { MapSearch } from "@/components/map/MapSearch";
import { ShippingMethodFilter } from "@/components/map/ShippingMethodFilter";
import { useTerritoryAssignments } from "@/hooks/useTerritoryAssignments";
import { useZipOverrideGeoJson } from "@/hooks/useZipOverrideGeoJson";
import {
  filterAssignmentsByShippingMethod,
  filterZipOverridesByShippingMethod,
  shippingMethodsFromAssignments,
} from "@/lib/queries/assignments";
import { useCountyDetail, normalizeFips } from "@/hooks/useCountyDetail";
import { useZipLookup } from "@/hooks/useZipLookup";
import { AskMapsFloat } from "@/components/lookup/AskMapsFloat";

const MapboxMap = dynamic(
  () => import("@/components/map/MapboxMap").then((m) => m.MapboxMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-muted animate-pulse" /> },
);

export type MapPageVariant = "full" | "embed" | "admin";

type MapSelection =
  | { kind: "county"; fips: string }
  | { kind: "zip"; zip: string }
  | null;

export function MapPageContent({ variant = "full" }: { variant?: MapPageVariant }) {
  const { data: assignments = {}, isLoading } = useTerritoryAssignments();
  const { data: zipOverrideGeoJson } = useZipOverrideGeoJson();
  const [methodFilterIds, setMethodFilterIds] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<MapSelection>(null);
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);
  const [zipHoverInfo, setZipHoverInfo] = useState<{ zip: string; territoryName: string } | null>(
    null,
  );

  const shippingMethods = useMemo(
    () => shippingMethodsFromAssignments(assignments),
    [assignments],
  );

  const displayAssignments = useMemo(
    () => filterAssignmentsByShippingMethod(assignments, methodFilterIds),
    [assignments, methodFilterIds],
  );

  const displayZipOverrides = useMemo(
    () => filterZipOverridesByShippingMethod(zipOverrideGeoJson, methodFilterIds),
    [zipOverrideGeoJson, methodFilterIds],
  );

  const selectedFips = selection?.kind === "county" ? selection.fips : null;
  const selectedZip = selection?.kind === "zip" ? selection.zip : null;

  const handleCountyClick = useCallback((fips: string) => {
    setSelection({ kind: "county", fips: normalizeFips(fips) });
  }, []);

  const handleZipClick = useCallback((zip: string) => {
    setSelection({ kind: "zip", zip });
  }, []);

  const {
    data: countyDetail,
    isLoading: countyLoading,
    error: countyError,
  } = useCountyDetail(selectedFips);

  const {
    data: zipDetail,
    isLoading: zipLoading,
    error: zipError,
  } = useZipLookup(selectedZip);

  return (
    <div
      className={
        variant === "admin"
          ? "h-full flex flex-col min-h-0"
          : "h-screen flex flex-col"
      }
    >
      {variant === "full" ? (
        <SiteHeader />
      ) : variant === "embed" ? (
        <div className="flex shrink-0 items-center justify-between border-b bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
          <span className="font-medium tracking-tight">Fabuwood shipping territories</span>
          <Link
            href="/map"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Open full map
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}

      <div className="flex-1 relative min-h-0">
        {isLoading ? (
          <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center">
            <p className="text-muted-foreground">Loading map data...</p>
          </div>
        ) : (
          <MapboxMap
            assignments={displayAssignments}
            zipOverrideGeoJson={displayZipOverrides ?? null}
            dimUnmatchedCounties={methodFilterIds.size > 0}
            mode="view"
            onCountyClick={handleCountyClick}
            onZipClick={handleZipClick}
            onCountyHover={setHoverInfo}
            onZipHover={setZipHoverInfo}
            className="h-full w-full"
          />
        )}

        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm">
          <div className="glass-panel flex flex-col gap-2 rounded-xl p-2">
            <ShippingMethodFilter
              methods={shippingMethods}
              selected={methodFilterIds}
              onChange={setMethodFilterIds}
              className="border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
            />
            <MapSearch />
            {methodFilterIds.size > 0 && (
              <p className="text-[11px] text-muted-foreground px-1">
                Only selected shipping methods are colored on the map.
              </p>
            )}
          </div>
          {zipHoverInfo ? (
            <div className="glass-panel rounded-md px-3 py-2 text-sm">
              <span className="font-mono font-medium">{zipHoverInfo.zip}</span>
              <span className="mx-1.5 text-muted-foreground">·</span>
              <span className="font-medium">{zipHoverInfo.territoryName}</span>
            </div>
          ) : (
            hoverInfo &&
            displayAssignments[hoverInfo] && (
              <div className="glass-panel rounded-md px-3 py-2 text-sm">
                <span className="font-medium">{displayAssignments[hoverInfo].territoryName}</span>
              </div>
            )
          )}
        </div>

        <MapLegend
          assignments={displayAssignments}
          className={
            variant === "embed"
              ? "absolute bottom-4 left-4 z-10 w-48 text-xs"
              : "absolute bottom-4 left-4 z-10 w-56"
          }
        />

        <ZipDetailPanel
          zip={selectedZip}
          detail={zipDetail}
          isLoading={zipLoading}
          error={zipError}
          onClose={() => setSelection(null)}
        />

        {!selectedZip && (
          <CountyPanel
            fips={selectedFips}
            detail={countyDetail}
            isLoading={countyLoading}
            error={countyError}
            onClose={() => setSelection(null)}
          />
        )}

        <AskMapsFloat />
      </div>
    </div>
  );
}
