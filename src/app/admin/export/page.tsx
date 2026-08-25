"use client";

import { MapExportContent } from "@/components/map/MapExportContent";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";

export default function MapExportPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b bg-white px-8 py-4 shadow-sm">
        <AdminPageHeader
          title="Map Export"
          description="Filter by shipping method, preview territory colors, and download a PDF shipping map."
        />
      </div>
      <div className="min-h-0 flex-1">
        <MapExportContent />
      </div>
    </div>
  );
}
