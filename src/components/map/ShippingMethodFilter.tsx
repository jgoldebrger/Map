"use client";

import { Layers } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  methods: { id: string; name: string }[];
  value: string | null;
  onChange: (methodId: string | null) => void;
  className?: string;
};

export function ShippingMethodFilter({ methods, value, onChange, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border bg-white/95 p-2 shadow-lg backdrop-blur",
        className,
      )}
    >
      <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Select
        value={value ?? "all"}
        onValueChange={(next) => onChange(next === "all" ? null : next)}
      >
        <SelectTrigger className="h-8 w-44 bg-white" aria-label="Filter by shipping method">
          <SelectValue placeholder="All methods" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All methods</SelectItem>
          {methods.map((method) => (
            <SelectItem key={method.id} value={method.id}>
              {method.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
