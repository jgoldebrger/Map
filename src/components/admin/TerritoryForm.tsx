"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { territorySchema, type TerritoryInput } from "@/lib/validators/territory";
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

type ShippingMethod = { id: string; name: string };

type Props = {
  methods: ShippingMethod[];
  defaultValues?: Partial<TerritoryInput>;
  onSubmit: (data: TerritoryInput) => Promise<void>;
  onCancel: () => void;
};

export function TerritoryForm({ methods, defaultValues, onSubmit, onCancel }: Props) {
  const form = useForm<TerritoryInput>({
    resolver: zodResolver(territorySchema),
    defaultValues: {
      name: "",
      color: "#3B82F6",
      active: true,
      ...defaultValues,
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ship Day</Label>
          <Input {...form.register("shipDay")} placeholder="Monday" />
        </div>
        <div className="space-y-2">
          <Label>Cutoff Day</Label>
          <Input {...form.register("cutoffDay")} placeholder="Friday" />
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
