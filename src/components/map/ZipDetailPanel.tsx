"use client";

import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LookupResult } from "@/lib/services/lookup";

type Props = {
  zip: string | null;
  detail: LookupResult | undefined;
  isLoading?: boolean;
  error?: Error | null;
  onClose: () => void;
};

export function ZipDetailPanel({ zip, detail, isLoading, error, onClose }: Props) {
  if (!zip) return null;

  return (
    <div className="absolute right-4 top-4 bottom-4 w-80 rounded-xl border bg-white shadow-xl z-20 flex flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="font-semibold">ZIP Details</h2>
          {detail?.zipOverride && (
            <Badge variant="secondary" className="mt-1 text-[10px]">
              Territory override
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}
        {error && <p className="text-sm text-destructive">Could not load ZIP details.</p>}
        {detail && (
          <>
            <DetailRow label="ZIP" value={detail.zip ?? zip} mono />
            {detail.city && <DetailRow label="City" value={detail.city} />}
            {detail.county && detail.state && (
              <DetailRow label="County" value={`${detail.county}, ${detail.state}`} />
            )}
            <hr />
            <TerritoryRow label="Territory" name={detail.territory} color={detail.color} />
            <DetailRow label="Shipping Method" value={detail.shippingMethod} />
            <DetailRow label="Ship Day" value={detail.shipDay ?? "—"} />
            <DetailRow label="Cutoff Day" value={detail.cutoffDay ?? "—"} />
            {detail.zipOverride && detail.countyTerritory && (
              <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1.5">
                <p className="font-medium text-foreground">County default</p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm border"
                    style={{ backgroundColor: detail.countyTerritoryColor ?? "#e2e8f0" }}
                  />
                  {detail.countyTerritory}
                </p>
                <p>This ZIP uses a territory override instead of the county assignment.</p>
              </div>
            )}
            {detail.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{detail.notes}</p>
              </div>
            )}
          </>
        )}
        {!isLoading && !error && !detail && (
          <p className="text-sm text-muted-foreground">No details available.</p>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function TerritoryRow({
  label,
  name,
  color,
}: {
  label: string;
  name: string;
  color?: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium flex items-center gap-2">
        {color && (
          <span
            className="h-3 w-3 shrink-0 rounded-sm border"
            style={{ backgroundColor: color }}
          />
        )}
        {name}
      </p>
    </div>
  );
}
