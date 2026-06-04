import { z } from "zod";

export const askMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const askRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(askMessageSchema).max(10).optional(),
});

export type AskRequest = z.infer<typeof askRequestSchema>;
export type AskMessage = z.infer<typeof askMessageSchema>;
