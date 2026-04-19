import { z } from "zod";

export const createProjectSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().nullable().optional(),
  goal: z.string().nullable().optional(),
  status: z.enum(["planning", "active", "paused", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  startDate: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .omit({ workspaceId: true });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
