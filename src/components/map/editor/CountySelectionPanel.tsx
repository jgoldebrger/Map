"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { countyLabelFromFips } from "@/lib/county-geo";

type Props = {
  selectedFips: Set<string>;
  countyFeatures: GeoJSON.Feature[];
  assignTerritoryName: string | null;
  onRemove: (fips: string) => void;
  onClear: () => void;
  onAssign: () => void;
  assignDisabled: boolean;
  saving?: boolean;
};

export function CountySelectionPanel({
  selectedFips,
  countyFeatures,
  assignTerritoryName,
  onRemove,
  onClear,
  onAssign,
  assignDisabled,
  saving,
}: Props) {
  if (selectedFips.size === 0) return null;

  const sorted = [...selectedFips].sort((a, b) => {
    const la = countyLabelFromFips(a, countyFeatures) ?? a;
    const lb = countyLabelFromFips(b, countyFeatures) ?? b;
    return la.localeCompare(lb);
  });

  return (
    <div className="glass-panel z-20 flex max-h-[min(420px,50vh)] w-80 flex-col rounded-xl custom-scrollbar">
      <div className="flex items-start justify-between gap-2 border-b px-3 py-2.5">
        <div>
          <h2 className="text-sm font-semibold">{selectedFips.size} counties selected</h2>
          {assignTerritoryName && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Assign to: {assignTerritoryName}
            </p>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClear}>
          <X className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>

      <ul className="custom-scrollbar flex-1 divide-y overflow-y-auto text-sm">
        {sorted.map((fips) => (
          <li key={fips} className="flex items-center justify-between gap-2 px-3 py-1.5">
            <span className="min-w-0 truncate">
              {countyLabelFromFips(fips, countyFeatures) ?? fips}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground"
              onClick={() => onRemove(fips)}
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Remove</span>
            </Button>
          </li>
        ))}
      </ul>

      <div className="border-t p-3">
        <Button className="w-full" disabled={assignDisabled || saving} onClick={onAssign}>
          {saving ? "Assigning…" : `Assign ${selectedFips.size} counties`}
        </Button>
      </div>
    </div>
  );
}
