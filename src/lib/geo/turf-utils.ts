import bbox from "@turf/bbox";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon as turfPolygon } from "@turf/helpers";
import type { Feature, Polygon, MultiPolygon } from "geojson";

export type BBox = [number, number, number, number];

export function getBBoxFromBounds(
  sw: { lng: number; lat: number },
  ne: { lng: number; lat: number }
): BBox {
  return [sw.lng, sw.lat, ne.lng, ne.lat];
}

export function isPointInBBox(lng: number, lat: number, box: BBox): boolean {
  const [minX, minY, maxX, maxY] = box;
  return lng >= minX && lng <= maxX && lat >= minY && lat <= maxY;
}

export function isCentroidInPolygon(
  centroid: [number, number],
  drawPolygon: Feature<Polygon | MultiPolygon>
): boolean {
  return booleanPointInPolygon(point(centroid), drawPolygon);
}

export function polygonFromCoords(coords: number[][][]): Feature<Polygon> {
  return turfPolygon(coords);
}

export { bbox };
