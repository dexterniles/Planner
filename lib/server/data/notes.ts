import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { and, desc, eq, type SQL } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type Note = InferSelectModel<typeof notes>;

export type NoteParentType =
  | "course"
  | "project"
  | "assignment"
  | "task"
  | "session"
  | "daily_log"
  | "standalone"
  | "event";

export async function getNotes(
  userId: string,
  parentType?: NoteParentType,
  parentId?: string,
): Promise<Note[]> {
  const conditions: SQL[] = [eq(notes.userId, userId)];
  if (parentType) conditions.push(eq(notes.parentType, parentType));
  if (parentId) conditions.push(eq(notes.parentId, parentId));

  return db
    .select()
    .from(notes)
    .where(and(...conditions))
    .orderBy(desc(notes.updatedAt));
}
