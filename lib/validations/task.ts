import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(["not_started", "in_progress", "done", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  parentTaskId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .omit({ projectId: true });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
