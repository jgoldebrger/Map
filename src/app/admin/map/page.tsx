"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTerritoryAssignments, usePatchAssignments, useRevertAssignments } from "@/hooks/useTerritoryAssignments";
import { useZipOverrideGeoJson } from "@/hooks/useZipOverrideGeoJson";
import { useMapEditorHistory } from "@/hooks/useMapEditorHistory";
import { MapLegend } from "@/components/map/MapLegend";
import { ShippingMethodFilter } from "@/components/map/ShippingMethodFilter";
import type mapboxgl from "mapbox-gl";
import { CountySelectionPanel } from "@/components/map/editor/CountySelectionPanel";
import { MapEditorToolbar } from "@/components/map/editor/MapEditorToolbar";
import { PolygonDrawTool } from "@/components/map/editor/PolygonDrawTool";
import { ZipAssignPanel } from "@/components/map/editor/ZipAssignPanel";
import type { CountyClickModifiers } from "@/components/map/MapboxMap";
import { boundsForFeatures, countyFipsInStates, featuresInStates } from "@/lib/county-geo";
import type { AssignmentMap } from "@/lib/queries/assignments";
import {
  filterAssignmentsByShippingMethod,
  filterZipOverridesByShippingMethod,
  shippingMethodsFromAssignments,
} from "@/lib/queries/assignments";
import { AskMapsFloat } from "@/components/lookup/AskMapsFloat";

const MapboxMap = dynamic(
  () => import("@/components/map/MapboxMap").then((m) => m.MapboxMap),
  { ssr: false, loading: () => <div className="h-full bg-muted animate-pulse" /> }
);

type CountyClickMode = "add" | "replace";

type Territory = {
  id: string;
  name: string;
  color: string;
  shipDay: string | null;
  cutoffDay: string | null;
  notes: string | null;
  shippingMethodId: string;
  shippingMethod: { id: string; name: string };
};

export default function MapEditorPage() {
  const { data: assignments = {}, isLoading } = useTerritoryAssignments();
  const { data: zipOverrideGeoJson } = useZipOverrideGeoJson();
  const patchAssignments = usePatchAssignments();
  const revertAssignments = useRevertAssignments();
  const { push, undo, canUndo } = useMapEditorHistory();

  const [selectedFips, setSelectedFips] = useState<Set<string>>(new Set());
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [assignTerritoryId, setAssignTerritoryId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [polygonMode, setPolygonMode] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [countyFeatures, setCountyFeatures] = useState<GeoJSON.Feature[]>([]);
  const [statePicker, setStatePicker] = useState<Set<string>>(new Set());
  const [zipPanelOpen, setZipPanelOpen] = useState(false);
  const [zipMessage, setZipMessage] = useState<string | null>(null);
  const [countyClickMode, setCountyClickMode] = useState<CountyClickMode>("add");
  const [boxSelectMode, setBoxSelectMode] = useState(false);
  const [methodFilterIds, setMethodFilterIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    fetch("/geo/us-counties.geojson")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => setCountyFeatures(data.features ?? []))
      .catch(() => setCountyFeatures([]));
  }, []);

  useEffect(() => {
    fetch("/api/territories")
      .then((r) => r.json())
      .then((data: (Territory & { active?: boolean })[]) =>
        setTerritories(data.filter((t) => t.active !== false)),
      );
  }, []);

  const normalizeFips = (fips: string) => fips.padStart(5, "0").slice(-5);

  const addSelection = useCallback((fips: string | string[]) => {
    const codes = Array.isArray(fips) ? fips : [fips];
    setSelectedFips((prev) => {
      const next = new Set(prev);
      codes.forEach((c) => next.add(normalizeFips(c)));
      return next;
    });
    setAssignError(null);
  }, []);

  const replaceSelection = useCallback((fips: string | string[]) => {
    const codes = (Array.isArray(fips) ? fips : [fips]).map(normalizeFips);
    setSelectedFips(new Set(codes));
    setAssignError(null);
  }, []);

  const toggleSelection = useCallback((fips: string) => {
    const code = normalizeFips(fips);
    setSelectedFips((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    setAssignError(null);
  }, []);

  const removeFromSelection = useCallback((fips: string) => {
    const code = normalizeFips(fips);
    setSelectedFips((prev) => {
      if (!prev.has(code)) return prev;
      const next = new Set(prev);
      next.delete(code);
      return next;
    });
  }, []);

  const applyFipsSelection = useCallback(
    (fips: string[]) => {
      if (countyClickMode === "replace") replaceSelection(fips);
      else addSelection(fips);
    },
    [countyClickMode, addSelection, replaceSelection],
  );

  const handleCountyClick = useCallback(
    (fips: string, modifiers?: CountyClickModifiers) => {
      if (modifiers?.toggle) {
        toggleSelection(fips);
        return;
      }
      if (countyClickMode === "replace") replaceSelection(fips);
      else addSelection(fips);
    },
    [countyClickMode, addSelection, replaceSelection, toggleSelection],
  );

  const handleBoxSelect = useCallback(
    (fips: string[]) => {
      applyFipsSelection(fips);
    },
    [applyFipsSelection],
  );

  const selectStateCounties = useCallback(
    (mode: "add" | "replace") => {
      if (statePicker.size === 0) return;
      const fips = countyFipsInStates(countyFeatures, statePicker);
      if (fips.length === 0) return;

      if (mode === "replace") {
        setSelectedFips(new Set(fips));
      } else {
        addSelection(fips);
      }
      setAssignError(null);

      const bounds = boundsForFeatures(featuresInStates(countyFeatures, statePicker));
      if (bounds && mapInstance) {
        mapInstance.fitBounds(bounds, { padding: 48, duration: 800, maxZoom: 7 });
      }
    },
    [statePicker, countyFeatures, addSelection, mapInstance],
  );

  const handleAssign = async () => {
    if (!assignTerritoryId || selectedFips.size === 0) return;
    setSaving(true);
    setAssignError(null);

    const fipsCodes = [...selectedFips];
    const previousAssignments: Record<string, AssignmentMap[string] | null> = {};
    const previousTerritoryIds: Record<string, string | null> = {};
    for (const f of fipsCodes) {
      const key = f.padStart(5, "0").slice(-5);
      previousAssignments[key] = assignments[key] ?? null;
      previousTerritoryIds[key] = assignments[key]?.territoryId ?? null;
    }

    const territory = territories.find((t) => t.id === assignTerritoryId);
    if (territory) {
      patchAssignments(fipsCodes, territory);
    }

    const res = await fetch("/api/counties", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fipsCodes, territoryId: assignTerritoryId }),
    });

    setSaving(false);
    if (res.ok) {
      push({ fipsCodes, previousTerritoryIds, newTerritoryId: assignTerritoryId });
      setSelectedFips(new Set());
      return;
    }

    revertAssignments(fipsCodes, previousAssignments);

    const body = await res.json().catch(() => ({}));
    setAssignError(typeof body.error === "string" ? body.error : "Assignment failed.");
  };

  const handleUndo = async () => {
    const entry = undo();
    if (!entry) return;
    for (const fips of entry.fipsCodes) {
      const prevId = entry.previousTerritoryIds[fips];
      const prevTerritory = prevId ? (territories.find((t) => t.id === prevId) ?? null) : null;
      patchAssignments([fips], prevTerritory);
      if (prevId) {
        await fetch("/api/counties", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fipsCodes: [fips], territoryId: prevId }),
        });
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <MapEditorToolbar
        countyClickMode={countyClickMode}
        onCountyClickModeChange={setCountyClickMode}
        boxSelectMode={boxSelectMode}
        onBoxSelectModeChange={setBoxSelectMode}
        polygonMode={polygonMode}
        onPolygonModeChange={setPolygonMode}
        selectedCount={selectedFips.size}
        onClearSelection={() => setSelectedFips(new Set())}
        statePicker={statePicker}
        onStatePickerChange={setStatePicker}
        onReplaceWithStates={() => selectStateCounties("replace")}
        onAddStates={() => selectStateCounties("add")}
        territories={territories}
        assignTerritoryId={assignTerritoryId}
        onAssignTerritoryIdChange={(id) => {
          setAssignTerritoryId(id);
          setAssignError(null);
        }}
        onAssignCounties={handleAssign}
        saving={saving}
        zipPanelOpen={zipPanelOpen}
        onZipPanelOpenChange={(open) => {
          setZipPanelOpen(open);
          if (!open) setZipMessage(null);
        }}
        canUndo={canUndo}
        onUndo={handleUndo}
        assignError={assignError}
        zipMessage={zipMessage}
      />

      <div className="flex-1 relative">
        {!isLoading && (
          <MapboxMap
            assignments={displayAssignments}
            zipOverrideGeoJson={displayZipOverrides ?? null}
            dimUnmatchedCounties={methodFilterIds.size > 0}
            mode="edit"
            selectedFips={selectedFips}
            boxSelectEnabled={boxSelectMode}
            onCountyClick={handleCountyClick}
            onBoxSelect={handleBoxSelect}
            onMapReady={setMapInstance}
            className="h-full w-full"
          />
        )}
        <PolygonDrawTool
          map={mapInstance}
          enabled={polygonMode}
          countyFeatures={countyFeatures}
          onSelect={applyFipsSelection}
        />
        <div className="absolute top-4 left-4 z-10 flex max-w-sm flex-col gap-2">
          <div className="glass-panel flex flex-col gap-2 rounded-xl p-2">
            <ShippingMethodFilter
              methods={shippingMethods}
              selected={methodFilterIds}
              onChange={setMethodFilterIds}
              className="border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
            />
          </div>
          <CountySelectionPanel
            selectedFips={selectedFips}
            countyFeatures={countyFeatures}
            assignTerritoryName={
              territories.find((t) => t.id === assignTerritoryId)?.name ?? null
            }
            onRemove={removeFromSelection}
            onClear={() => setSelectedFips(new Set())}
            onAssign={handleAssign}
            assignDisabled={!assignTerritoryId || selectedFips.size === 0}
            saving={saving}
          />
        </div>
        <MapLegend assignments={displayAssignments} className="absolute bottom-4 right-4 z-10 w-52" />
        {zipPanelOpen && (
          <ZipAssignPanel
            assignTerritoryId={assignTerritoryId}
            selectedCountyFips={selectedFips}
            assignments={assignments}
            countyFeatures={countyFeatures}
            onClose={() => setZipPanelOpen(false)}
            onMessage={setZipMessage}
          />
        )}
        <AskMapsFloat />
      </div>
    </div>
  );
}
