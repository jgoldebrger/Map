import { z } from "zod";

export const territorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  shippingMethodId: z.string().min(1, "Shipping method is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid hex color required"),
  shipDay: z.string().optional(),
  cutoffDay: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

export type TerritoryInput = z.infer<typeof territorySchema>;
