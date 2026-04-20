import { z } from "zod";

export const createNoteSchema = z.object({
  parentType: z.enum([
    "course",
    "project",
    "assignment",
    "task",
    "session",
    "daily_log",
    "standalone",
    "event",
  ]),
  parentId: z.string().uuid().nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  content: z.string().nullable().optional(),
  sessionDate: z.string().nullable().optional(),
});

export const updateNoteSchema = createNoteSchema
  .partial()
  .omit({ parentType: true, parentId: true });

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
