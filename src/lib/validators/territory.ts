import { z } from "zod";
import { parseCutoffDay, parseShipDay } from "@/lib/weekdays";

export const territorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  shippingMethodId: z.string().min(1, "Shipping method is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid hex color required"),
  shipDay: z
    .string()
    .optional()
    .refine(
      (value) => !value || parseShipDay(value) !== undefined,
      "Ship day must be a valid weekday",
    ),
  cutoffDay: z
    .string()
    .optional()
    .refine(
      (value) => !value || parseCutoffDay(value) !== undefined,
      "Cutoff day must be a valid weekday",
    ),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

export type TerritoryInput = z.infer<typeof territorySchema>;

export function territoryInputFromForm(data: {
  name: string;
  shippingMethodId: string;
  color: string;
  shipDay?: string;
  cutoffDay?: string;
  notes?: string;
  active: boolean;
}): TerritoryInput {
  return {
    name: data.name,
    shippingMethodId: data.shippingMethodId,
    color: data.color,
    shipDay: parseShipDay(data.shipDay),
    cutoffDay: parseCutoffDay(data.cutoffDay),
    notes: data.notes,
    active: data.active,
  };
}
