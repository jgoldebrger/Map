"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WEEKDAYS, type Weekday } from "@/lib/weekdays";
import { cn } from "@/lib/utils";

type WeekdayMultiSelectProps = {
  label: string;
  selected: Weekday[];
  onChange: (selected: Weekday[]) => void;
  placeholder?: string;
};

export function WeekdayMultiSelect({
  label,
  selected,
  onChange,
  placeholder = "Select days",
}: WeekdayMultiSelectProps) {
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

  const selectedSet = new Set(selected);

  const toggle = (day: Weekday) => {
    const next = selectedSet.has(day)
      ? selected.filter((d) => d !== day)
      : [...selected, day];
    onChange(WEEKDAYS.filter((d) => next.includes(d)));
  };

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.length} days`;

  return (
    <div className="relative space-y-2" ref={containerRef}>
      <Label>{label}</Label>
      <Button
        type="button"
        variant="outline"
        className="h-9 w-full justify-between gap-2 font-normal"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="truncate text-left">{summary}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-60", open && "rotate-180")} />
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[12rem] rounded-md border bg-white p-2 shadow-lg">
          <div className="mb-2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => onChange([...WEEKDAYS])}
            >
              All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => onChange([])}
            >
              Clear
            </Button>
          </div>
          <ul className="space-y-0.5">
            {WEEKDAYS.map((day) => (
              <li key={day}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    className="rounded border-input"
                    checked={selectedSet.has(day)}
                    onChange={() => toggle(day)}
                  />
                  {day}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
