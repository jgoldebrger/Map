"use client";

import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { MapPageContent } from "@/components/map/MapPageContent";
import { usePermissions } from "@/hooks/usePermissions";

export default function AdminLiveMapPage() {
  const { hasPermission } = usePermissions();

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex shrink-0 items-center justify-between border-b bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Live Map</h1>
          <p className="text-sm text-muted-foreground">
            Current territory assignments — same view as the public map
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission("county:assign") && (
            <Link
              href="/admin/map"
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
              Map Editor
            </Link>
          )}
          <Link
            href="/map"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Public map
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <MapPageContent variant="admin" />
      </div>
    </div>
  );
}
