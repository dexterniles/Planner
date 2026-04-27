import { z } from "zod";

export const createInboxItemSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

export const resultingItemTypeValues = [
  "task",
  "assignment",
  "note",
  "event",
  "bill",
  "project",
] as const;

export const triageInboxSchema = z.object({
  triagedAt: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), {
      message: "Invalid datetime",
    })
    .nullable()
    .optional(),
  resultingItemType: z.enum(resultingItemTypeValues).nullable().optional(),
  resultingItemId: z.string().uuid().nullable().optional(),
});

export type CreateInboxItemInput = z.infer<typeof createInboxItemSchema>;
export type TriageInboxInput = z.infer<typeof triageInboxSchema>;
export type ResultingItemType = (typeof resultingItemTypeValues)[number];
