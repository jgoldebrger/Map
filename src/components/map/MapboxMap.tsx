"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { AssignmentMap } from "@/lib/queries/assignments";
import { assignmentColorRevision } from "@/lib/queries/assignments";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";

export type MapMode = "view" | "edit";

function ensureZipOverrideLayers(map: mapboxgl.Map, geojson: GeoJSON.FeatureCollection) {
  const sourceId = "zip-overrides";
  const maskId = "zip-overrides-mask";
  const fillId = "zip-overrides-fill";

  const existing = map.getSource(sourceId);
  if (existing && "setData" in existing) {
    existing.setData(geojson);
  } else if (!existing) {
    map.addSource(sourceId, { type: "geojson", data: geojson, generateId: true });
  }

  if (!map.getLayer(maskId)) {
    map.addLayer(
      {
        id: maskId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": "#f1f5f9",
          "fill-opacity": 1,
        },
      },
      map.getLayer(fillId) ? fillId : "counties-selected",
    );
  }

  if (!map.getLayer(fillId)) {
    map.addLayer(
      {
        id: fillId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": ["coalesce", ["get", "color"], "#94a3b8"],
          "fill-opacity": 1,
          "fill-outline-color": "#334155",
        },
      },
      "counties-selected",
    );

    map.addLayer(
      {
        id: "zip-overrides-outline",
        type: "line",
        source: sourceId,
        paint: {
          "line-color": "#1e293b",
          "line-width": 1,
        },
      },
      "counties-selected",
    );
  }
}

function zipOverrideRevision(geojson: GeoJSON.FeatureCollection | null | undefined): string {
  if (!geojson?.features?.length) return "";
  return geojson.features
    .map((f) => `${f.properties?.zip}:${f.properties?.color}`)
    .sort()
    .join("|");
}

export type MapboxMapProps = {
  assignments: AssignmentMap;
  zipOverrideGeoJson?: GeoJSON.FeatureCollection | null;
  mode?: MapMode;
  selectedFips?: Set<string>;
  onCountyClick?: (fips: string) => void;
  onZipClick?: (zip: string) => void;
  onCountyHover?: (fips: string | null) => void;
  onZipHover?: (info: { zip: string; territoryName: string } | null) => void;
  onBoxSelect?: (fips: string[]) => void;
  onMapReady?: (map: mapboxgl.Map | null) => void;
  className?: string;
};

const US_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-125, 24],
  [-66, 50],
];

function buildColorExpression(assignments: AssignmentMap): mapboxgl.Expression {
  const entries = Object.entries(assignments);
  if (entries.length === 0) {
    return ["literal", "#e2e8f0"];
  }

  const matchExpr: unknown[] = ["match", ["get", "GEOID"]];
  for (const [fips, data] of entries) {
    matchExpr.push(fips, data.color);
  }
  matchExpr.push("#e2e8f0");
  return matchExpr as mapboxgl.Expression;
}

function fipsFromFeature(props: GeoJSON.GeoJsonProperties | null | undefined): string | undefined {
  const raw = props?.GEOID ?? props?.geoid;
  if (raw == null || raw === "") return undefined;
  return String(raw).padStart(5, "0").slice(-5);
}

function ensureCountyLayers(map: mapboxgl.Map, assignments: AssignmentMap) {
  const sourceId = "counties";
  const layerId = "counties-fill";

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data: "/geo/us-counties.geojson",
      generateId: true,
    });
  }

  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": buildColorExpression(assignments),
        "fill-opacity": 0.7,
        "fill-outline-color": "#64748b",
      },
    });

    map.addLayer({
      id: "counties-outline",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#94a3b8",
        "line-width": 0.5,
      },
    });

    map.addLayer({
      id: "counties-selected",
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#2563eb",
        "line-width": 3,
      },
      filter: ["in", ["get", "GEOID"], ["literal", []]],
    });
  } else {
    map.setPaintProperty(layerId, "fill-color", buildColorExpression(assignments));
  }
}

export function MapboxMap({
  assignments,
  zipOverrideGeoJson,
  mode = "view",
  selectedFips,
  onCountyClick,
  onZipClick,
  onCountyHover,
  onZipHover,
  onBoxSelect,
  onMapReady,
  className,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const assignmentsRef = useRef(assignments);
  assignmentsRef.current = assignments;
  const colorRevision = assignmentColorRevision(assignments);
  const zipRevision = zipOverrideRevision(zipOverrideGeoJson);

  const zipGeoRef = useRef(zipOverrideGeoJson);
  zipGeoRef.current = zipOverrideGeoJson;

  const onCountyClickRef = useRef(onCountyClick);
  onCountyClickRef.current = onCountyClick;

  const onZipClickRef = useRef(onZipClick);
  onZipClickRef.current = onZipClick;

  const onCountyHoverRef = useRef(onCountyHover);
  onCountyHoverRef.current = onCountyHover;

  const onZipHoverRef = useRef(onZipHover);
  onZipHoverRef.current = onZipHover;

  const onBoxSelectRef = useRef(onBoxSelect);
  onBoxSelectRef.current = onBoxSelect;

  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-98, 39],
      zoom: 3.5,
      maxBounds: US_BOUNDS,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const handleLoad = () => {
      ensureCountyLayers(map, assignmentsRef.current);
      if (zipGeoRef.current?.features?.length) {
        ensureZipOverrideLayers(map, zipGeoRef.current);
      }
      onMapReadyRef.current?.(map);
    };

    map.on("load", handleLoad);

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const zipLayer = map.getLayer("zip-overrides-fill");
      if (zipLayer) {
        const zipFeatures = map.queryRenderedFeatures(e.point, { layers: ["zip-overrides-fill"] });
        const zip = zipFeatures[0]?.properties?.zip;
        if (typeof zip === "string" && zip.length > 0) {
          onZipClickRef.current?.(zip);
          return;
        }
      }

      const countyFeatures = map.queryRenderedFeatures(e.point, { layers: ["counties-fill"] });
      const fips = fipsFromFeature(countyFeatures[0]?.properties);
      if (fips) onCountyClickRef.current?.(fips);
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const zipLayer = map.getLayer("zip-overrides-fill");
      if (zipLayer) {
        const zipFeatures = map.queryRenderedFeatures(e.point, { layers: ["zip-overrides-fill"] });
        const props = zipFeatures[0]?.properties;
        const zip = props?.zip;
        const territoryName = props?.territoryName;
        if (typeof zip === "string" && typeof territoryName === "string") {
          map.getCanvas().style.cursor = "pointer";
          onZipHoverRef.current?.({ zip, territoryName });
          onCountyHoverRef.current?.(null);
          return;
        }
      }

      map.getCanvas().style.cursor = "pointer";
      const countyFeatures = map.queryRenderedFeatures(e.point, { layers: ["counties-fill"] });
      const fips = fipsFromFeature(countyFeatures[0]?.properties);
      onZipHoverRef.current?.(null);
      onCountyHoverRef.current?.(fips ?? null);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      onZipHoverRef.current?.(null);
      onCountyHoverRef.current?.(null);
    };

    map.on("click", handleClick);
    map.on("mousemove", handleMouseMove);
    map.on("mouseleave", handleMouseLeave);

    let mouseDown: ((e: mapboxgl.MapMouseEvent) => void) | undefined;
    let mouseMove: ((e: mapboxgl.MapMouseEvent) => void) | undefined;
    let mouseUp: ((e: mapboxgl.MapMouseEvent) => void) | undefined;

    if (mode === "edit") {
      let start: mapboxgl.Point | null = null;
      let box: HTMLDivElement | null = null;
      const canvas = map.getCanvasContainer();

      mouseDown = (e: mapboxgl.MapMouseEvent) => {
        if (e.originalEvent.shiftKey) {
          map.dragPan.disable();
          start = e.point;
          box = document.createElement("div");
          box.className = "absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none z-10";
          box.style.left = `${start.x}px`;
          box.style.top = `${start.y}px`;
          canvas.appendChild(box);
        }
      };

      mouseMove = (e: mapboxgl.MapMouseEvent) => {
        if (!start || !box) return;
        const minX = Math.min(start.x, e.point.x);
        const minY = Math.min(start.y, e.point.y);
        const maxX = Math.max(start.x, e.point.x);
        const maxY = Math.max(start.y, e.point.y);
        box.style.left = `${minX}px`;
        box.style.top = `${minY}px`;
        box.style.width = `${maxX - minX}px`;
        box.style.height = `${maxY - minY}px`;
      };

      mouseUp = (e: mapboxgl.MapMouseEvent) => {
        if (!start || !box) return;
        map.dragPan.enable();
        const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [start, e.point];
        const features = map.queryRenderedFeatures(bbox, { layers: ["counties-fill"] });
        const fips = [
          ...new Set(
            features
              .map((f) => fipsFromFeature(f.properties))
              .filter((f): f is string => Boolean(f)),
          ),
        ];
        onBoxSelectRef.current?.(fips);
        box.remove();
        box = null;
        start = null;
      };

      map.on("mousedown", mouseDown);
      map.on("mousemove", mouseMove);
      map.on("mouseup", mouseUp);
    }

    mapRef.current = map;

    return () => {
      onMapReadyRef.current?.(null);
      map.off("load", handleLoad);
      map.off("click", handleClick);
      map.off("mousemove", handleMouseMove);
      map.off("mouseleave", handleMouseLeave);
      if (mouseDown) map.off("mousedown", mouseDown);
      if (mouseMove) map.off("mousemove", mouseMove);
      if (mouseUp) map.off("mouseup", mouseUp);
      map.remove();
      mapRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyColors = () => {
      if (!map.isStyleLoaded()) return;
      ensureCountyLayers(map, assignmentsRef.current);
      const zipGeo = zipOverrideGeoJson ?? zipGeoRef.current;
      if (zipGeo?.features?.length) {
        ensureZipOverrideLayers(map, zipGeo);
      } else if (map.getSource("zip-overrides") && "setData" in map.getSource("zip-overrides")!) {
        (map.getSource("zip-overrides") as mapboxgl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [],
        });
      }
      map.triggerRepaint();
    };

    applyColors();
    if (!map.isStyleLoaded()) {
      map.once("load", applyColors);
    }
  }, [colorRevision, zipRevision, zipOverrideGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("counties-selected")) return;
    const fips = selectedFips ? [...selectedFips] : [];
    map.setFilter("counties-selected", ["in", ["get", "GEOID"], ["literal", fips]]);
  }, [selectedFips]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-center p-6 text-sm text-muted-foreground ${className ?? ""}`}
      >
        Map unavailable: set <code className="mx-1">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in Vercel
        environment variables and redeploy.
      </div>
    );
  }

  return (
    <div className={className ?? "relative h-full w-full"}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

export function resetMapView(map: mapboxgl.Map | null) {
  map?.flyTo({ center: [-98, 39], zoom: 3.5 });
}
