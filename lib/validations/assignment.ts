import { z } from "zod";

const optionalDatetimeString = z
  .string()
  .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), {
    message: "Invalid datetime",
  });

export const createAssignmentSchema = z.object({
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
});

export const updateAssignmentSchema = createAssignmentSchema
  .partial()
  .omit({ courseId: true });

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
