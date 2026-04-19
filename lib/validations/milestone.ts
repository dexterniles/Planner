import { z } from "zod";

export const createMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
});

export const updateMilestoneSchema = createMilestoneSchema
  .partial()
  .omit({ projectId: true })
  .extend({
    completedAt: z.string().nullable().optional(),
  });

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
