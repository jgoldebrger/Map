"use client";

import type { AssignmentMap } from "@/lib/queries/assignments";

type Props = {
  assignments: AssignmentMap;
  className?: string;
};

export function MapLegend({ assignments, className }: Props) {
  const territories = new Map<
    string,
    { name: string; color: string; method: string }
  >();

  for (const a of Object.values(assignments)) {
    if (!territories.has(a.territoryId)) {
      territories.set(a.territoryId, {
        name: a.territoryName,
        color: a.color,
        method: a.shippingMethod,
      });
    }
  }

  const grouped = new Map<string, { name: string; color: string }[]>();
  for (const t of territories.values()) {
    const list = grouped.get(t.method) ?? [];
    list.push({ name: t.name, color: t.color });
    grouped.set(t.method, list);
  }

  const methods = [...grouped.keys()].sort();

  return (
    <div
      className={`rounded-lg border bg-white/95 p-4 shadow-lg backdrop-blur max-h-[70vh] overflow-y-auto ${className ?? ""}`}
    >
      <h3 className="text-sm font-semibold mb-3">Territories</h3>
      {methods.map((method) => (
        <div key={method} className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {method}
          </p>
          <ul className="space-y-1">
            {(grouped.get(method) ?? [])
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((t) => (
                <li key={t.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-3 w-3 rounded-sm shrink-0 border"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="truncate">{t.name}</span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
