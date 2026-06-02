import { z } from "zod";

export const lookupSchema = z.object({
  type: z.enum(["zip", "county", "city", "territory", "state"]),
  query: z.string().min(1, "Search query is required"),
});

export type LookupInput = z.infer<typeof lookupSchema>;
