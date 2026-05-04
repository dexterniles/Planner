import { z } from "zod";

export const incomeKindValues = ["paycheck", "misc"] as const;

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const createIncomeSchema = z.object({
  kind: z.enum(incomeKindValues),
  receivedDate: dateString,
  amount: z.number().nonnegative(),
  source: z.string().max(120).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateIncomeSchema = createIncomeSchema.partial();

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type IncomeKind = (typeof incomeKindValues)[number];
