"use client";

import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CountyDetail } from "@/hooks/useCountyDetail";

type Props = {
  fips: string | null;
  detail: CountyDetail | undefined;
  isLoading?: boolean;
  error?: Error | null;
  onClose: () => void;
};

export function CountyPanel({ fips, detail, isLoading, error, onClose }: Props) {
  if (!fips) return null;

  return (
    <div className="absolute right-4 top-4 bottom-4 w-80 rounded-xl border bg-white shadow-xl z-20 flex flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-semibold">County Details</h2>
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
        {error && (
          <p className="text-sm text-destructive">Could not load county details.</p>
        )}
        {detail && (
          <>
            <DetailRow label="County" value={detail.county} />
            <DetailRow label="State" value={detail.state} />
            <DetailRow label="FIPS" value={detail.fipsCode} />
            <hr />
            <DetailRow label="Territory" value={detail.territory ?? "Unassigned"} />
            <DetailRow label="Shipping Method" value={detail.shippingMethod ?? "—"} />
            <DetailRow label="Ship Day" value={detail.shipDay ?? "—"} />
            <DetailRow label="Cutoff Day" value={detail.cutoffDay ?? "—"} />
            {detail.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{detail.notes}</p>
              </div>
            )}
          </>
        )}
        {!isLoading && !error && !detail && (
          <>
            <DetailRow label="FIPS" value={fips} />
            <p className="text-sm text-muted-foreground">No details available.</p>
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
