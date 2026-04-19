import { z } from "zod";

export const createInboxItemSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

export type CreateInboxItemInput = z.infer<typeof createInboxItemSchema>;
