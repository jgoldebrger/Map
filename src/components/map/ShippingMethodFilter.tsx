"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  methods: { id: string; name: string }[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  className?: string;
};

export function ShippingMethodFilter({ methods, selected, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const label =
    selected.size === 0
      ? "All methods"
      : selected.size === 1
        ? (methods.find((m) => selected.has(m.id))?.name ?? "1 method")
        : `${selected.size} methods`;

  return (
    <div
      ref={containerRef}
      className={cn(
        "glass-panel relative flex flex-wrap items-center gap-2 rounded-lg p-2",
        className,
      )}
    >
      <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Button
        type="button"
        variant="outline"
        className="h-8 min-w-[9rem] justify-between gap-2 bg-white font-normal"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Filter by shipping method"
      >
        <span className="truncate text-sm">{label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-60", open && "rotate-180")} />
      </Button>
      {open && (
        <div className="absolute left-2 top-full z-50 mt-1 w-56 rounded-md border bg-white p-2 shadow-lg">
          <div className="mb-2 flex flex-wrap gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onChange(new Set(methods.map((m) => m.id)))}
            >
              All
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
          <ul className="max-h-64 space-y-0.5 overflow-y-auto" role="listbox">
            {methods.length === 0 ? (
              <li className="px-2 py-3 text-center text-sm text-muted-foreground">No methods</li>
            ) : (
              methods.map((method) => (
                <li key={method.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      className="rounded border-input"
                      checked={selected.has(method.id)}
                      onChange={() => toggle(method.id)}
                    />
                    <span className="truncate">{method.name}</span>
                  </label>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
