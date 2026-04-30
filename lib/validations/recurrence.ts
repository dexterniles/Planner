import { z } from "zod";

export const recurrencePayloadSchema = z.object({
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "custom"]),
  interval: z.number().int().min(1).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).nullable().optional(),
  endDate: z.string().nullable().optional(),
  count: z.number().int().min(1).nullable().optional(),
});

export const createRecurrenceRuleSchema = recurrencePayloadSchema.extend({
  ownerType: z.enum(["assignment", "task", "event", "bill"]),
  ownerId: z.string().uuid(),
});

export type CreateRecurrenceRuleInput = z.infer<
  typeof createRecurrenceRuleSchema
>;
export type RecurrencePayload = z.infer<typeof recurrencePayloadSchema>;
