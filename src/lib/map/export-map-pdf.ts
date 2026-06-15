import { jsPDF } from "jspdf";
import type { AssignmentMap } from "@/lib/queries/assignments";
import { boundsForFeatures, fipsFromGeoFeature } from "@/lib/county-geo";
import type mapboxgl from "mapbox-gl";

export type ExportTerritoryEntry = {
  name: string;
  color: string;
  shipDay: string | null;
  cutoffDay: string | null;
  shippingMethod: string;
};

export function uniqueTerritoriesFromAssignments(
  assignments: AssignmentMap,
): ExportTerritoryEntry[] {
  const seen = new Map<string, ExportTerritoryEntry>();
  for (const entry of Object.values(assignments)) {
    if (seen.has(entry.territoryId)) continue;
    seen.set(entry.territoryId, {
      name: entry.territoryName,
      color: entry.color,
      shipDay: entry.shipDay,
      cutoffDay: entry.cutoffDay,
      shippingMethod: entry.shippingMethod,
    });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function exportTitleForMethods(
  methodIds: ReadonlySet<string>,
  methods: { id: string; name: string }[],
): string {
  const names = methods.filter((m) => methodIds.has(m.id)).map((m) => m.name);
  if (names.length === 0) return "Shipping Map";
  if (names.length === 1) return `${names[0]} Shipping Map`;
  return `${names.join(" & ")} Shipping Map`;
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned.padStart(6, "0").slice(0, 6);
  const num = Number.parseInt(full, 16);
  if (Number.isNaN(num)) return [148, 163, 184];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function waitForMapIdle(map: mapboxgl.Map): Promise<void> {
  return new Promise((resolve) => {
    if (!map.isMoving()) {
      map.once("idle", () => resolve());
      map.triggerRepaint();
      return;
    }
    map.once("idle", () => resolve());
  });
}

export function fitMapToAssignmentCounties(
  map: mapboxgl.Map,
  countyFeatures: GeoJSON.Feature[],
  assignments: AssignmentMap,
): boolean {
  const fipsSet = new Set(Object.keys(assignments));
  const features = countyFeatures.filter((feature) => {
    const fips = fipsFromGeoFeature(feature);
    return fips != null && fipsSet.has(fips);
  });
  const bounds = boundsForFeatures(features);
  if (!bounds) return false;
  map.fitBounds(bounds, { padding: 72, duration: 0, maxZoom: 6.5 });
  return true;
}

export async function captureMapCanvas(map: mapboxgl.Map): Promise<string> {
  await waitForMapIdle(map);
  await new Promise((r) => setTimeout(r, 150));
  return map.getCanvas().toDataURL("image/png");
}

type BuildPdfOptions = {
  title: string;
  mapImageDataUrl: string;
  territories: ExportTerritoryEntry[];
  subtitle?: string;
};

export function buildMapExportPdf({
  title,
  mapImageDataUrl,
  territories,
  subtitle,
}: BuildPdfOptions): Blob {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const headerH = 14;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(title, pageW / 2, margin + 5, { align: "center" });

  if (subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    pdf.text(subtitle, pageW / 2, margin + 10, { align: "center" });
    pdf.setTextColor(0, 0, 0);
  }

  const contentTop = margin + headerH;
  const legendW = 62;
  const legendX = margin;
  const mapX = legendX + legendW + 6;
  const mapY = contentTop;
  const mapW = pageW - mapX - margin;
  const mapH = pageH - mapY - margin;

  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.2);
  pdf.rect(legendX, mapY, legendW, mapH);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Territories", legendX + 3, mapY + 5);

  let y = mapY + 10;
  const lineH = 3.6;
  const grouped = new Map<string, ExportTerritoryEntry[]>();
  for (const t of territories) {
    const list = grouped.get(t.shippingMethod) ?? [];
    list.push(t);
    grouped.set(t.shippingMethod, list);
  }

  for (const method of [...grouped.keys()].sort()) {
    if (y > mapY + mapH - 8) break;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(method.toUpperCase(), legendX + 3, y);
    y += lineH;

    for (const t of (grouped.get(method) ?? []).sort((a, b) => a.name.localeCompare(b.name))) {
      if (y > mapY + mapH - 6) break;
      const [r, g, b] = hexToRgb(t.color);
      pdf.setFillColor(r, g, b);
      pdf.rect(legendX + 3, y - 2.5, 3.5, 3.5, "F");
      pdf.setDrawColor(120, 120, 120);
      pdf.rect(legendX + 3, y - 2.5, 3.5, 3.5, "S");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      const nameLines = pdf.splitTextToSize(t.name, legendW - 10);
      pdf.text(nameLines, legendX + 8, y);
      y += lineH * Math.max(1, nameLines.length);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      if (t.shipDay) {
        pdf.text(`Ship: ${t.shipDay}`, legendX + 8, y);
        y += lineH;
      }
      if (t.cutoffDay) {
        pdf.text(`Cutoff: ${t.cutoffDay}`, legendX + 8, y);
        y += lineH;
      }
      y += 1.5;
    }
    y += 2;
  }

  pdf.setDrawColor(180, 180, 180);
  pdf.rect(mapX, mapY, mapW, mapH);
  pdf.addImage(mapImageDataUrl, "PNG", mapX + 1, mapY + 1, mapW - 2, mapH - 2);

  return pdf.output("blob");
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportFilenameFromTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "shipping-map"}.pdf`;
}
