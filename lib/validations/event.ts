import { z } from "zod";

export const eventStatusValues = [
  "confirmed",
  "tentative",
  "cancelled",
  "completed",
] as const;

const datetimeString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "Invalid datetime",
  });

const optionalDatetimeString = z
  .string()
  .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), {
    message: "Invalid datetime",
  });

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  startsAt: datetimeString,
  endsAt: optionalDatetimeString.nullable().optional(),
  allDay: z.boolean().optional(),
  location: z.string().max(500).nullable().optional(),
  url: z.string().max(1000).nullable().optional(),
  attendees: z.string().max(500).nullable().optional(),
  status: z.enum(eventStatusValues).optional(),
  color: z.string().max(20).nullable().optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const createEventCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  color: z.string().nullable().optional(),
});

export const updateEventCategorySchema = createEventCategorySchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateEventCategoryInput = z.infer<typeof createEventCategorySchema>;
export type UpdateEventCategoryInput = z.infer<typeof updateEventCategorySchema>;
export type EventStatus = (typeof eventStatusValues)[number];
