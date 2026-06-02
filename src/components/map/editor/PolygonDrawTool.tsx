"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import booleanIntersects from "@turf/boolean-intersects";
import { point } from "@turf/helpers";
import type { Feature, Polygon } from "geojson";

type Props = {
  map: mapboxgl.Map | null;
  enabled: boolean;
  countyFeatures: GeoJSON.Feature[];
  onSelect: (fipsCodes: string[]) => void;
};

function teardownDraw(map: mapboxgl.Map, draw: MapboxDraw, handleCreate: () => void) {
  try {
    map.off("draw.create", handleCreate);
  } catch {
    // map may already be removed
  }
  try {
    map.removeControl(draw);
  } catch {
    // control may already be removed
  }
}

export function PolygonDrawTool({ map, enabled, countyFeatures, onSelect }: Props) {
  const drawRef = useRef<MapboxDraw | null>(null);
  const onSelectRef = useRef(onSelect);
  const countyFeaturesRef = useRef(countyFeatures);

  onSelectRef.current = onSelect;
  countyFeaturesRef.current = countyFeatures;

  useEffect(() => {
    if (!map || !enabled) {
      return;
    }

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: "draw_polygon",
    });

    map.addControl(draw, "top-left");
    drawRef.current = draw;

    const handleCreate = () => {
      const data = draw.getAll();
      const poly = data.features[0] as Feature<Polygon> | undefined;
      if (!poly) return;

      const selected: string[] = [];
      for (const feature of countyFeaturesRef.current) {
        const raw = feature.properties?.GEOID ?? feature.properties?.geoid;
        if (raw == null || raw === "" || !feature.geometry) continue;
        const fips = String(raw).padStart(5, "0").slice(-5);
        try {
          const centroid = getCentroid(feature);
          if (centroid && booleanIntersects(point(centroid), poly)) {
            selected.push(fips);
          }
        } catch {
          // skip invalid geometry
        }
      }
      onSelectRef.current(selected);
      draw.deleteAll();
    };

    map.on("draw.create", handleCreate);

    return () => {
      teardownDraw(map, draw, handleCreate);
      drawRef.current = null;
    };
  }, [map, enabled]);

  return null;
}

function getCentroid(feature: GeoJSON.Feature): [number, number] | null {
  const g = feature.geometry;
  if (!g || g.type === "GeometryCollection") return null;
  if (g.type === "Point") return g.coordinates as [number, number];
  if (g.type === "Polygon") {
    const ring = g.coordinates[0];
    if (!ring?.length) return null;
    let lng = 0;
    let lat = 0;
    for (const c of ring) {
      lng += c[0];
      lat += c[1];
    }
    return [lng / ring.length, lat / ring.length];
  }
  if (g.type === "MultiPolygon") {
    return getCentroid({ ...feature, geometry: { type: "Polygon", coordinates: g.coordinates[0] } });
  }
  return null;
}
