import { z } from "zod";

export const upsertDailyLogSchema = z.object({
  logDate: z.string().min(1, "Date is required"),
  content: z.string().nullable().optional(),
  mood: z.string().max(50).nullable().optional(),
});

export type UpsertDailyLogInput = z.infer<typeof upsertDailyLogSchema>;
