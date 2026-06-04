"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ZipRowWithAssignment = {
  zip: string;
  city: string;
  county: { name: string; state: string };
  override: {
    territoryId: string;
    territoryName: string;
    color: string;
    shippingMethod: string;
  } | null;
  countyTerritory: {
    territoryId: string;
    territoryName: string;
    color: string;
  } | null;
};

type Props = {
  assignTerritoryId: string;
  selectedCountyFips: Set<string>;
  onClose: () => void;
  onMessage?: (message: string | null) => void;
};

export function ZipAssignPanel({
  assignTerritoryId,
  selectedCountyFips,
  onClose,
  onMessage,
}: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [limitToCounties, setLimitToCounties] = useState(selectedCountyFips.size > 0);
  const [overridesOnly, setOverridesOnly] = useState(false);
  const [rows, setRows] = useState<ZipRowWithAssignment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedZips, setSelectedZips] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (selectedCountyFips.size > 0) setLimitToCounties(true);
  }, [selectedCountyFips]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("includeOverrides", "1");
    params.set("limit", "100");
    params.set("page", "1");
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
    if (limitToCounties && selectedCountyFips.size > 0) {
      params.set("filterFips", [...selectedCountyFips].join(","));
    }
    if (overridesOnly) params.set("overridesOnly", "1");

    try {
      const res = await fetch(`/api/zipcodes?${params}`);
      const data = await res.json();
      setRows(data.zips ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, limitToCounties, overridesOnly, selectedCountyFips]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleZip = (zip: string) => {
    setSelectedZips((prev) => {
      const next = new Set(prev);
      if (next.has(zip)) next.delete(zip);
      else next.add(zip);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedZips(new Set(rows.map((r) => r.zip)));
  };

  const selectedWithOverride = useMemo(
    () => rows.filter((r) => selectedZips.has(r.zip) && r.override).map((r) => r.zip),
    [rows, selectedZips],
  );

  const handleAssign = async () => {
    if (!assignTerritoryId || selectedZips.size === 0) return;
    const count = selectedZips.size;
    setSaving(true);
    onMessage?.(null);
    const res = await fetch("/api/zipcodes/assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zips: [...selectedZips], territoryId: assignTerritoryId }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      onMessage?.(typeof err.error === "string" ? err.error : "ZIP assignment failed.");
      return;
    }
    setSelectedZips(new Set());
    onMessage?.(`Assigned ${count} ZIP code(s) — overrides county assignment for lookup.`);
    load();
  };

  const handleClearOverrides = async () => {
    const zips = selectedWithOverride.length > 0 ? selectedWithOverride : [...selectedZips];
    if (zips.length === 0) return;
    setSaving(true);
    onMessage?.(null);
    const res = await fetch("/api/zipcodes/assignments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zips }),
    });
    setSaving(false);
    if (!res.ok) {
      onMessage?.("Failed to clear ZIP overrides.");
      return;
    }
    const data = await res.json();
    setSelectedZips(new Set());
    onMessage?.(`Cleared ${data.cleared ?? 0} ZIP override(s) — using county assignment again.`);
    load();
  };

  return (
    <div className="absolute top-0 right-0 z-20 flex h-full w-full max-w-md flex-col border-l bg-white shadow-lg">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="font-semibold">ZIP assignments</h2>
          <p className="text-xs text-muted-foreground">
            Override county territory for specific ZIP codes
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 border-b p-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ZIP or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-input"
              checked={limitToCounties}
              disabled={selectedCountyFips.size === 0}
              onChange={(e) => setLimitToCounties(e.target.checked)}
            />
            <span>
              Limit to selected counties
              {selectedCountyFips.size > 0 && (
                <span className="text-muted-foreground"> ({selectedCountyFips.size})</span>
              )}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-input"
              checked={overridesOnly}
              onChange={(e) => setOverridesOnly(e.target.checked)}
            />
            <span>Overrides only</span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAllVisible} disabled={rows.length === 0}>
            Select page
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedZips(new Set())}
            disabled={selectedZips.size === 0}
          >
            Clear selection
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading ZIP codes…</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No ZIP codes match.</p>
        ) : (
          <ul className="divide-y">
            {rows.map((row) => {
              const effective = row.override ?? row.countyTerritory;
              return (
                <li key={row.zip}>
                  <label
                    className={cn(
                      "flex cursor-pointer gap-3 px-4 py-2.5 hover:bg-muted/50",
                      selectedZips.has(row.zip) && "bg-primary/5",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-input"
                      checked={selectedZips.has(row.zip)}
                      onChange={() => toggleZip(row.zip)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{row.zip}</span>
                        {row.override && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Override
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {row.city}, {row.county.name} {row.county.state}
                      </p>
                      {effective ? (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                          <span
                            className="h-2 w-2 shrink-0 rounded-sm border"
                            style={{ backgroundColor: effective.color }}
                          />
                          {effective.territoryName}
                          {row.override && row.countyTerritory && (
                            <span className="text-muted-foreground">
                              (county: {row.countyTerritory.territoryName})
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-muted-foreground">Not assigned</p>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="space-y-2 border-t p-4">
        <p className="text-xs text-muted-foreground">
          Showing {rows.length} of {total.toLocaleString()} · {selectedZips.size} selected
        </p>
        <Button
          className="w-full"
          disabled={!assignTerritoryId || selectedZips.size === 0 || saving}
          onClick={handleAssign}
        >
          Assign ZIP override ({selectedZips.size})
        </Button>
        <Button
          variant="outline"
          className="w-full"
          disabled={selectedWithOverride.length === 0 && selectedZips.size === 0}
          onClick={handleClearOverrides}
        >
          Clear override
          {selectedWithOverride.length > 0 ? ` (${selectedWithOverride.length})` : ""}
        </Button>
        {!assignTerritoryId && (
          <p className="text-xs text-amber-600">Select a territory in the toolbar first.</p>
        )}
      </div>
    </div>
  );
}
