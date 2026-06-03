import { z } from "zod";

export const lookupSchema = z.object({
  type: z.enum(["zip", "county", "city", "territory", "state"]),
  query: z.string().trim().min(1, "Search query is required").max(100),
});

export type LookupInput = z.infer<typeof lookupSchema>;
