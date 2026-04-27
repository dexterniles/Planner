import { z } from "zod";

const optionalDatetimeString = z
  .string()
  .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), {
    message: "Invalid datetime",
  });

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().nullable().optional(),
  dueDate: optionalDatetimeString.nullable().optional(),
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
