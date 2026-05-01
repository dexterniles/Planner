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

export const bulkMilestonesSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1),
    action: z.enum(["mark-done", "delete", "reschedule"]),
    days: z.number().int().min(-365).max(365).optional(),
  })
  .refine(
    (data) => data.action !== "reschedule" || typeof data.days === "number",
    { message: "days is required for reschedule", path: ["days"] },
  );

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type BulkMilestonesInput = z.infer<typeof bulkMilestonesSchema>;
