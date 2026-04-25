import { z } from "zod";

export const createCourseSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(200),
  code: z.string().max(20).nullable().optional(),
  instructor: z.string().max(200).nullable().optional(),
  semester: z.string().max(50).nullable().optional(),
  credits: z.number().int().min(0).max(20).nullable().optional(),
  meetingSchedule: z.any().nullable().optional(),
  color: z.string().nullable().optional(),
  status: z.enum(["active", "completed", "dropped", "planned"]).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export const updateCourseSchema = createCourseSchema.partial().omit({
  workspaceId: true,
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
