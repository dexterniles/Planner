import { z } from "zod";

export const eventCategoryValues = [
  "dinner",
  "concert",
  "travel",
  "hangout",
  "appointment",
  "social",
  "other",
] as const;

export const eventStatusValues = [
  "confirmed",
  "tentative",
  "cancelled",
  "completed",
] as const;

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().nullable().optional(),
  category: z.enum(eventCategoryValues).optional(),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().nullable().optional(),
  allDay: z.boolean().optional(),
  location: z.string().max(500).nullable().optional(),
  url: z.string().max(1000).nullable().optional(),
  attendees: z.string().max(500).nullable().optional(),
  status: z.enum(eventStatusValues).optional(),
  color: z.string().max(20).nullable().optional(),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventCategory = (typeof eventCategoryValues)[number];
export type EventStatus = (typeof eventStatusValues)[number];
