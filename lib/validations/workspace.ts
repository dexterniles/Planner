import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["academic", "projects", "custom"]),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
