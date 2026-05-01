import { z } from "zod";
import { recurrencePayloadSchema } from "./recurrence";

const optionalDatetimeString = z
  .string()
  .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), {
    message: "Invalid datetime",
  });

const taskObjectSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().nullable().optional(),
  dueDate: optionalDatetimeString.nullable().optional(),
  status: z.enum(["not_started", "in_progress", "done", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  parentTaskId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  recurrence: recurrencePayloadSchema.nullable().optional(),
});

export const createTaskSchema = taskObjectSchema.refine(
  (data) => !data.recurrence || (data.dueDate && data.dueDate !== ""),
  {
    message: "Recurring tasks need a due date",
    path: ["dueDate"],
  },
);

export const updateTaskSchema = taskObjectSchema
  .partial()
  .omit({ projectId: true, recurrence: true });

export const bulkTasksSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1),
    action: z.enum(["mark-done", "delete", "reschedule"]),
    days: z.number().int().min(-365).max(365).optional(),
  })
  .refine(
    (data) => data.action !== "reschedule" || typeof data.days === "number",
    { message: "days is required for reschedule", path: ["days"] },
  );

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type BulkTasksInput = z.infer<typeof bulkTasksSchema>;
