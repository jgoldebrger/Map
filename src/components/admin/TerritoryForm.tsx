"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  territorySchema,
  territoryInputFromForm,
  type TerritoryInput,
} from "@/lib/validators/territory";
import { WEEKDAYS, parseCutoffDay, parseShipDays, type Weekday } from "@/lib/weekdays";
import { WeekdayMultiSelect } from "@/components/admin/WeekdayMultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const territoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shippingMethodId: z.string().min(1, "Shipping method is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid hex color required"),
  cutoffDay: z.enum(WEEKDAYS).optional(),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

type TerritoryFormValues = z.infer<typeof territoryFormSchema>;

type ShippingMethod = { id: string; name: string };

type Props = {
  methods: ShippingMethod[];
  defaultValues?: Partial<TerritoryInput>;
  onSubmit: (data: TerritoryInput) => Promise<void>;
  onCancel: () => void;
};

export function TerritoryForm({ methods, defaultValues, onSubmit, onCancel }: Props) {
  const [shipDays, setShipDays] = useState<Weekday[]>(() =>
    parseShipDays(defaultValues?.shipDay),
  );

  const form = useForm<TerritoryFormValues>({
    resolver: zodResolver(territoryFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      shippingMethodId: defaultValues?.shippingMethodId ?? "",
      color: defaultValues?.color ?? "#3B82F6",
      active: defaultValues?.active ?? true,
      cutoffDay: parseCutoffDay(defaultValues?.cutoffDay),
      notes: defaultValues?.notes,
    },
  });

  if (methods.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Create a{" "}
        <Link href="/admin/shipping-methods" className="text-primary underline">
          shipping method
        </Link>{" "}
        first, then add territories.
      </p>
    );
  }

  const handleSubmit = async (data: TerritoryFormValues) => {
    const payload = territoryInputFromForm({
      ...data,
      shipDays,
    });
    const parsed = territorySchema.safeParse(payload);
    if (!parsed.success) {
      return;
    }
    await onSubmit(parsed.data);
  };

  const cutoffValue = form.watch("cutoffDay");

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...form.register("name")} />
      </div>
      <div className="space-y-2">
        <Label>Shipping Method</Label>
        <Select
          value={form.watch("shippingMethodId")}
          onValueChange={(v) => form.setValue("shippingMethodId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            {methods.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <ColorField
          value={form.watch("color")}
          onChange={(color) =>
            form.setValue("color", color, { shouldValidate: true, shouldDirty: true })
          }
          error={form.formState.errors.color?.message}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WeekdayMultiSelect
          label="Ship Days"
          selected={shipDays}
          onChange={setShipDays}
          placeholder="Select ship days"
        />
        <div className="space-y-2">
          <Label>Cutoff Day</Label>
          <Select
            value={cutoffValue ?? "_none"}
            onValueChange={(v) =>
              form.setValue("cutoffDay", v === "_none" ? undefined : (v as Weekday), {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cutoff day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">None</SelectItem>
              {WEEKDAYS.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea {...form.register("notes")} />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={form.watch("active")}
          onCheckedChange={(v) => form.setValue("active", v)}
        />
        <Label>Active</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

function normalizeHexColor(raw: string): string {
  let value = raw.trim();
  if (!value.startsWith("#")) value = `#${value}`;
  return value.slice(0, 7);
}

function ColorField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (color: string) => void;
  error?: string;
}) {
  const pickerValue = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#3B82F6";

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          type="color"
          className="w-16 h-9 p-1 cursor-pointer"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          aria-label="Pick territory color"
        />
        <Input
          value={value}
          onChange={(e) => onChange(normalizeHexColor(e.target.value))}
          placeholder="#3B82F6"
          spellCheck={false}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
