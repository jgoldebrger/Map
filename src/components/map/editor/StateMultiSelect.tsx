"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { US_STATES } from "@/lib/us-states";
import { cn } from "@/lib/utils";

type StateMultiSelectProps = {
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
};

export function StateMultiSelect({ selected, onChange }: StateMultiSelectProps) {
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

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(next);
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
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-60", open && "rotate-180")} />
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border bg-white p-2 shadow-lg">
          <div className="mb-2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => onChange(new Set(US_STATES.map(({ code }) => code)))}
            >
              All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => onChange(new Set())}
            >
              Clear
            </Button>
          </div>
          <ul className="max-h-64 overflow-y-auto space-y-0.5">
            {US_STATES.map(({ code }) => (
              <li key={code}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    className="rounded border-input"
                    checked={selected.has(code)}
                    onChange={() => toggle(code)}
                  />
                  <span className="font-medium">{code}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
