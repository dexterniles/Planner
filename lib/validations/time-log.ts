import { z } from "zod";

export const startTimeLogSchema = z.object({
  loggableType: z.enum(["course", "project", "assignment", "task"]),
  loggableId: z.string().uuid(),
  wasPomodoro: z.boolean().optional(),
  pomodoroIntervalMinutes: z.number().int().min(1).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const stopTimeLogSchema = z.object({
  notes: z.string().nullable().optional(),
});

export type StartTimeLogInput = z.infer<typeof startTimeLogSchema>;
export type StopTimeLogInput = z.infer<typeof stopTimeLogSchema>;
