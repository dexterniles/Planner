import { z } from "zod";

export const createRecurrenceRuleSchema = z.object({
  ownerType: z.enum(["assignment", "task"]),
  ownerId: z.string().uuid(),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "custom"]),
  interval: z.number().int().min(1).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).nullable().optional(),
  endDate: z.string().nullable().optional(),
  count: z.number().int().min(1).nullable().optional(),
});

export type CreateRecurrenceRuleInput = z.infer<
  typeof createRecurrenceRuleSchema
>;
