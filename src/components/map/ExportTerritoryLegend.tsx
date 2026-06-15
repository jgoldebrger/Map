"use client";

import type { ExportTerritoryEntry } from "@/lib/map/export-map-pdf";

type Props = {
  territories: ExportTerritoryEntry[];
};

export function ExportTerritoryLegend({ territories }: Props) {
  const grouped = new Map<string, ExportTerritoryEntry[]>();
  for (const t of territories) {
    const list = grouped.get(t.shippingMethod) ?? [];
    list.push(t);
    grouped.set(t.shippingMethod, list);
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      {[...grouped.keys()].sort().map((method) => (
        <div key={method}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {method}
          </p>
          <ul className="mt-1 space-y-2">
            {(grouped.get(method) ?? [])
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((t) => (
                <li key={t.name} className="text-xs">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border"
                      style={{ backgroundColor: t.color }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium leading-snug">{t.name}</p>
                      {t.shipDay && (
                        <p className="text-muted-foreground">Ship: {t.shipDay}</p>
                      )}
                      {t.cutoffDay && (
                        <p className="text-muted-foreground">Cutoff: {t.cutoffDay}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
