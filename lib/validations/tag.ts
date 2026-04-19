import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z.string().nullable().optional(),
});

export const updateTagSchema = createTagSchema.partial();

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
