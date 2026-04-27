import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type Task = InferSelectModel<typeof tasks>;

export type TasksFilters = { projectId?: string };

export async function getTasks(
  userId: string,
  opts: TasksFilters = {},
): Promise<Task[]> {
  const { projectId } = opts;
  if (projectId) {
    return db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.projectId, projectId)))
      .orderBy(tasks.createdAt);
  }
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(tasks.createdAt);
}

export async function getTaskById(
  userId: string,
  id: string,
): Promise<Task | null> {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  return task ?? null;
}
