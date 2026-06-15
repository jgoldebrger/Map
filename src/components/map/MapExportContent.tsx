"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Download, Loader2, Scan } from "lucide-react";
import type mapboxgl from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShippingMethodFilter } from "@/components/map/ShippingMethodFilter";
import { ExportTerritoryLegend } from "@/components/map/ExportTerritoryLegend";
import { useTerritoryAssignments } from "@/hooks/useTerritoryAssignments";
import { useZipOverrideGeoJson } from "@/hooks/useZipOverrideGeoJson";
import {
  filterAssignmentsByShippingMethod,
  filterZipOverridesByShippingMethod,
  shippingMethodsFromAssignments,
} from "@/lib/queries/assignments";
import {
  buildMapExportPdf,
  captureMapCanvas,
  downloadBlob,
  exportFilenameFromTitle,
  exportTitleForMethods,
  fitMapToAssignmentCounties,
  uniqueTerritoriesFromAssignments,
} from "@/lib/map/export-map-pdf";

const MapboxMap = dynamic(
  () => import("@/components/map/MapboxMap").then((m) => m.MapboxMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-muted animate-pulse" /> },
);

export function MapExportContent() {
  const { data: assignments = {}, isLoading } = useTerritoryAssignments();
  const { data: zipOverrideGeoJson } = useZipOverrideGeoJson();
  const [methodFilterIds, setMethodFilterIds] = useState<Set<string>>(new Set());
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [countyFeatures, setCountyFeatures] = useState<GeoJSON.Feature[]>([]);
  const [customTitle, setCustomTitle] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [zoomToColored, setZoomToColored] = useState(true);

  useEffect(() => {
    fetch("/geo/us-counties.geojson")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => setCountyFeatures(data.features ?? []))
      .catch(() => setCountyFeatures([]));
  }, []);

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

  const territories = useMemo(
    () => uniqueTerritoriesFromAssignments(displayAssignments),
    [displayAssignments],
  );

  const defaultTitle = useMemo(
    () => exportTitleForMethods(methodFilterIds, shippingMethods),
    [methodFilterIds, shippingMethods],
  );

  const title = customTitle.trim() || defaultTitle;

  const handleFitPreview = useCallback(() => {
    if (!mapInstance || Object.keys(displayAssignments).length === 0) return;
    fitMapToAssignmentCounties(mapInstance, countyFeatures, displayAssignments);
  }, [mapInstance, displayAssignments, countyFeatures]);

  const handleExport = useCallback(async () => {
    if (!mapInstance) {
      setExportError("Map is not ready yet.");
      return;
    }
    if (methodFilterIds.size === 0) {
      setExportError("Select at least one shipping method to export.");
      return;
    }
    if (Object.keys(displayAssignments).length === 0) {
      setExportError("No assigned counties match the selected shipping methods.");
      return;
    }

    setExporting(true);
    setExportError(null);

    try {
      if (zoomToColored) {
        fitMapToAssignmentCounties(mapInstance, countyFeatures, displayAssignments);
      }
      const mapImage = await captureMapCanvas(mapInstance);
      const blob = buildMapExportPdf({
        title,
        mapImageDataUrl: mapImage,
        territories,
        subtitle: "Territory colors reflect current map assignments. ZIP overrides included where applicable.",
      });
      downloadBlob(blob, exportFilenameFromTitle(title));
    } catch {
      setExportError("PDF export failed. Try again after the map finishes loading.");
    } finally {
      setExporting(false);
    }
  }, [
    mapInstance,
    methodFilterIds,
    displayAssignments,
    countyFeatures,
    zoomToColored,
    title,
    territories,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <div className="relative min-h-[24rem] flex-1 min-w-0">
        {isLoading ? (
          <div className="flex h-full items-center justify-center bg-muted">
            <p className="text-muted-foreground">Loading map data…</p>
          </div>
        ) : (
          <MapboxMap
            assignments={displayAssignments}
            zipOverrideGeoJson={displayZipOverrides ?? null}
            dimUnmatchedCounties={methodFilterIds.size > 0}
            preserveDrawingBuffer
            mode="view"
            onMapReady={setMapInstance}
            className="h-full w-full"
          />
        )}

        <div className="absolute top-4 left-4 z-10">
          <ShippingMethodFilter
            methods={shippingMethods}
            selected={methodFilterIds}
            onChange={setMethodFilterIds}
          />
        </div>
      </div>

      <aside className="flex w-full shrink-0 flex-col border-t bg-white lg:w-80 lg:border-l lg:border-t-0">
        <div className="border-b p-4">
          <h2 className="text-sm font-semibold">Export PDF</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Select shipping methods, preview the colored map, then export a landscape PDF like the
            CCDT/CCLT shipping maps.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-2">
            <Label htmlFor="export-title">PDF title</Label>
            <Input
              id="export-title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={defaultTitle}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="rounded border-input"
              checked={zoomToColored}
              onChange={(e) => setZoomToColored(e.target.checked)}
            />
            Zoom to colored area in export
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!mapInstance || Object.keys(displayAssignments).length === 0}
              onClick={handleFitPreview}
            >
              <Scan className="mr-1.5 h-3.5 w-3.5" />
              Fit preview
            </Button>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Legend preview
            </p>
            {territories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {methodFilterIds.size === 0
                  ? "Select shipping methods to preview territories."
                  : "No territories assigned for the selected methods."}
              </p>
            ) : (
              <ExportTerritoryLegend territories={territories} />
            )}
          </div>
        </div>

        <div className="space-y-2 border-t p-4">
          {exportError && <p className="text-sm text-destructive">{exportError}</p>}
          <Button
            className="w-full"
            disabled={exporting || isLoading || methodFilterIds.size === 0}
            onClick={() => void handleExport()}
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating PDF…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </aside>
    </div>
  );
}
