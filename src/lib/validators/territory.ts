import { z } from "zod";
import { formatShipDays, parseCutoffDay, parseShipDays } from "@/lib/weekdays";

export const territorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  shippingMethodId: z.string().min(1, "Shipping method is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid hex color required"),
  shipDay: z
    .string()
    .optional()
    .refine(
      (value) => !value || parseShipDays(value).length > 0,
      "Ship days must be valid weekdays",
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
  shipDays: string[];
  cutoffDay?: string;
  notes?: string;
  active: boolean;
}): TerritoryInput {
  return {
    name: data.name,
    shippingMethodId: data.shippingMethodId,
    color: data.color,
    shipDay: formatShipDays(data.shipDays),
    cutoffDay: parseCutoffDay(data.cutoffDay),
    notes: data.notes,
    active: data.active,
  };
}
