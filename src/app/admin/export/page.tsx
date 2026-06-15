"use client";

import { MapExportContent } from "@/components/map/MapExportContent";

export default function MapExportPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b bg-white px-4 py-3">
        <h1 className="text-lg font-semibold">Map Export</h1>
        <p className="text-sm text-muted-foreground">
          Filter by shipping method, preview territory colors, and download a PDF shipping map.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <MapExportContent />
      </div>
    </div>
  );
}
