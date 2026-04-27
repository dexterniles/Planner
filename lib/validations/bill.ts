import { z } from "zod";

export const billStatusValues = ["unpaid", "paid", "skipped"] as const;
export const payFrequencyValues = ["weekly", "biweekly", "monthly"] as const;

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const optionalDateString = z
  .string()
  .refine((s) => s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s), {
    message: "Date must be in YYYY-MM-DD format",
  });

const optionalDatetimeString = z
  .string()
  .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), {
    message: "Invalid datetime",
  });

export const createBillSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().nullable().optional(),
  amount: z.number().nonnegative(),
  categoryId: z.string().uuid().nullable().optional(),
  dueDate: dateString,
  status: z.enum(billStatusValues).optional(),
  paidAt: optionalDatetimeString.nullable().optional(),
  paidAmount: z.number().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  /** If set, materialize N instances using the recurrence rule */
  recurrence: z
    .object({
      frequency: z.enum(["weekly", "biweekly", "monthly"]),
      count: z.number().int().min(1).max(60).optional(),
      endDate: optionalDateString.nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const updateBillSchema = createBillSchema
  .partial()
  .omit({ recurrence: true });

export const bulkMarkPaidSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const createBillCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  color: z.string().nullable().optional(),
});

export const updateBillCategorySchema = createBillCategorySchema.partial();

export const upsertPayScheduleSchema = z.object({
  frequency: z.enum(payFrequencyValues),
  referenceDate: z.string().min(1),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type CreateBillCategoryInput = z.infer<typeof createBillCategorySchema>;
export type UpdateBillCategoryInput = z.infer<typeof updateBillCategorySchema>;
export type UpsertPayScheduleInput = z.infer<typeof upsertPayScheduleSchema>;
export type BillStatus = (typeof billStatusValues)[number];
export type PayFrequency = (typeof payFrequencyValues)[number];
