import { z } from "zod";

export const shippingMethodSchema = z.object({
  name: z.string().min(1, "Name is required").max(64),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export type ShippingMethodInput = z.infer<typeof shippingMethodSchema>;
