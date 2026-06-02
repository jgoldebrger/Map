"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTerritoryAssignments, useInvalidateAssignments } from "@/hooks/useTerritoryAssignments";
import { useMapEditorHistory } from "@/hooks/useMapEditorHistory";
import { MapLegend } from "@/components/map/MapLegend";
import { UndoRedoToolbar } from "@/components/map/editor/UndoRedoToolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type mapboxgl from "mapbox-gl";
import { PolygonDrawTool } from "@/components/map/editor/PolygonDrawTool";
import { US_STATES } from "@/lib/us-states";
import { boundsForFeatures, countyFipsInState, featuresInState } from "@/lib/county-geo";

const MapboxMap = dynamic(
  () => import("@/components/map/MapboxMap").then((m) => m.MapboxMap),
  { ssr: false, loading: () => <div className="h-full bg-muted animate-pulse" /> }
);

type Territory = {
  id: string;
  name: string;
  color: string;
  shippingMethod: { name: string };
};

export default function MapEditorPage() {
  const { data: assignments = {}, isLoading } = useTerritoryAssignments();
  const invalidate = useInvalidateAssignments();
  const { push, undo, canUndo, canRedo } = useMapEditorHistory();

  const [selectedFips, setSelectedFips] = useState<Set<string>>(new Set());
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [assignTerritoryId, setAssignTerritoryId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [polygonMode, setPolygonMode] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [countyFeatures, setCountyFeatures] = useState<GeoJSON.Feature[]>([]);
  const [statePicker, setStatePicker] = useState<string>("");

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

  const addSelection = useCallback((fips: string | string[]) => {
    const codes = Array.isArray(fips) ? fips : [fips];
    setSelectedFips((prev) => {
      const next = new Set(prev);
      codes.forEach((c) => next.add(c.padStart(5, "0").slice(-5)));
      return next;
    });
    setAssignError(null);
  }, []);

  const handleCountyClick = useCallback(
    (fips: string) => {
      addSelection(fips);
    },
    [addSelection],
  );

  const handleBoxSelect = useCallback(
    (fips: string[]) => {
      addSelection(fips);
    },
    [addSelection],
  );

  const selectStateCounties = useCallback(
    (mode: "add" | "replace") => {
      if (!statePicker) return;
      const fips = countyFipsInState(countyFeatures, statePicker);
      if (fips.length === 0) return;

      if (mode === "replace") {
        setSelectedFips(new Set(fips));
      } else {
        addSelection(fips);
      }
      setAssignError(null);

      const bounds = boundsForFeatures(featuresInState(countyFeatures, statePicker));
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
    const previousTerritoryIds: Record<string, string | null> = {};
    for (const f of fipsCodes) {
      previousTerritoryIds[f] = assignments[f]?.territoryId ?? null;
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
      invalidate();
      return;
    }

    const body = await res.json().catch(() => ({}));
    setAssignError(typeof body.error === "string" ? body.error : "Assignment failed.");
  };

  const handleUndo = async () => {
    const entry = undo();
    if (!entry) return;
    for (const fips of entry.fipsCodes) {
      const prevId = entry.previousTerritoryIds[fips];
      if (prevId) {
        await fetch("/api/counties", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fipsCodes: [fips], territoryId: prevId }),
        });
      }
    }
    invalidate();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-white p-4 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-xl font-bold">Map Editor</h1>
          <p className="text-sm text-muted-foreground">
            Click counties, Shift+drag a box, draw a polygon, or select a full state. Assigning
            sets territory and shipping method (via territory).
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">State</Label>
              <Select value={statePicker} onValueChange={setStatePicker}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="ST" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {US_STATES.map(({ code }) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!statePicker}
              onClick={() => selectStateCounties("replace")}
            >
              Select state
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!statePicker}
              onClick={() => selectStateCounties("add")}
              className="text-muted-foreground"
            >
              Add state
            </Button>
            <div className="space-y-1">
              <Label className="text-xs">Assign to</Label>
              <Select
                value={assignTerritoryId}
                onValueChange={(v) => {
                  setAssignTerritoryId(v);
                  setAssignError(null);
                }}
              >
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select territory" />
                </SelectTrigger>
                <SelectContent>
                  {territories.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {t.shippingMethod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAssign}
              disabled={!assignTerritoryId || selectedFips.size === 0 || saving}
            >
              Assign ({selectedFips.size})
            </Button>
            <Button variant="outline" onClick={() => setSelectedFips(new Set())}>
              Clear
            </Button>
            <Button
              variant={polygonMode ? "default" : "outline"}
              onClick={() => setPolygonMode((p) => !p)}
            >
              {polygonMode ? "Exit Draw" : "Draw Polygon"}
            </Button>
          </div>
          {assignError && (
            <p className="text-sm text-destructive max-w-xl text-right">{assignError}</p>
          )}
        </div>
        {polygonMode && (
          <Badge variant="secondary" className="ml-4">
            Draw a polygon on the map to select counties inside it
          </Badge>
        )}
      </div>

      <div className="flex-1 relative">
        {!isLoading && (
          <MapboxMap
            assignments={assignments}
            mode="edit"
            selectedFips={selectedFips}
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
          onSelect={(fips) => addSelection(fips)}
        />
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-xs">
          {selectedFips.size > 0 && (
            <Badge variant="secondary" className="w-fit">
              {selectedFips.size} counties selected
            </Badge>
          )}
          <UndoRedoToolbar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={() => {}}
            selectedCount={selectedFips.size}
            saving={saving}
          />
        </div>
        <MapLegend assignments={assignments} className="absolute bottom-4 right-4 z-10 w-52" />
      </div>
    </div>
  );
}
