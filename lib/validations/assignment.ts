import { z } from "zod";
import { recurrencePayloadSchema } from "./recurrence";

const optionalDatetimeString = z
  .string()
  .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), {
    message: "Invalid datetime",
  });

const assignmentObjectSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().nullable().optional(),
  dueDate: optionalDatetimeString.nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  status: z
    .enum(["not_started", "in_progress", "submitted", "graded"])
    .optional(),
  pointsEarned: z.number().min(0).nullable().optional(),
  pointsPossible: z.number().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  recurrence: recurrencePayloadSchema.nullable().optional(),
});

export const createAssignmentSchema = assignmentObjectSchema.refine(
  (data) => !data.recurrence || (data.dueDate && data.dueDate !== ""),
  {
    message: "Recurring assignments need a due date",
    path: ["dueDate"],
  },
);

export const updateAssignmentSchema = assignmentObjectSchema
  .partial()
  .omit({ courseId: true, recurrence: true });

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
