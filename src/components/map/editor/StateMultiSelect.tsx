"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { US_STATES } from "@/lib/us-states";
import { cn } from "@/lib/utils";

type StateMultiSelectProps = {
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
};

function matchesQuery(code: string, name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
}

export function StateMultiSelect({ selected, onChange }: StateMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    setQuery("");
  }, [open]);

  const filtered = useMemo(
    () => US_STATES.filter(({ code, name }) => matchesQuery(code, name, query)),
    [query],
  );

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(next);
  };

  const selectFiltered = () => {
    onChange(new Set(filtered.map(({ code }) => code)));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      if (filtered.length === 1) {
        toggle(filtered[0].code);
        setQuery("");
      } else {
        selectFiltered();
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  const label =
    selected.size === 0
      ? "Select states"
      : selected.size === 1
        ? [...selected][0]
        : `${selected.size} states`;

  return (
    <div className="relative space-y-1" ref={containerRef}>
      <Label className="text-xs">States</Label>
      <Button
        type="button"
        variant="outline"
        className="h-9 min-w-[7rem] justify-between gap-2 font-normal"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-60", open && "rotate-180")} />
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-md border bg-white p-2 shadow-lg">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Type state name or code…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onChange(new Set(US_STATES.map(({ code }) => code)))}
            >
              All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={filtered.length === 0}
              onClick={selectFiltered}
            >
              {query.trim() ? "Select matches" : "Select all shown"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onChange(new Set())}
            >
              Clear
            </Button>
          </div>
          <ul className="max-h-64 overflow-y-auto space-y-0.5" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-sm text-muted-foreground text-center">No matches</li>
            ) : (
              filtered.map(({ code, name }) => (
                <li key={code}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      className="rounded border-input"
                      checked={selected.has(code)}
                      onChange={() => toggle(code)}
                    />
                    <span className="font-medium w-7 shrink-0">{code}</span>
                    <span className="text-muted-foreground truncate">{name}</span>
                  </label>
                </li>
              ))
            )}
          </ul>
          {query.trim() && filtered.length > 1 && (
            <p className="mt-2 px-1 text-xs text-muted-foreground">
              Press Enter to select all {filtered.length} matches
            </p>
          )}
        </div>
      )}
    </div>
  );
}
