"use client";

import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { MapPageContent } from "@/components/map/MapPageContent";
import { AdminPageHeader } from "@/components/layout/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";

export default function AdminLiveMapPage() {
  const { hasPermission } = usePermissions();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b bg-white px-8 py-4 shadow-sm">
        <AdminPageHeader
          title="Live Map"
          description="Current territory assignments — same view as the public map"
        >
          {hasPermission("county:assign") && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/map">
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Map Editor
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/map" target="_blank" rel="noopener noreferrer">
              Public map
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </AdminPageHeader>
      </div>
      <div className="min-h-0 flex-1">
        <MapPageContent variant="admin" />
      </div>
    </div>
  );
}
