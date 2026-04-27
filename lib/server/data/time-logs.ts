import { db } from "@/lib/db";
import { timeLogs } from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type TimeLog = InferSelectModel<typeof timeLogs>;

export type TimeLogsFilters = {
  loggableType?: string;
  loggableId?: string;
  limit?: number;
};

export async function getTimeLogs(
  userId: string,
  opts: TimeLogsFilters = {},
): Promise<TimeLog[]> {
  const { loggableType, loggableId, limit = 50 } = opts;
  if (loggableType && loggableId) {
    return db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.userId, userId),
          eq(
            timeLogs.loggableType,
            loggableType as "course" | "project" | "assignment" | "task",
          ),
          eq(timeLogs.loggableId, loggableId),
        ),
      )
      .orderBy(desc(timeLogs.startedAt))
      .limit(limit);
  }
  return db
    .select()
    .from(timeLogs)
    .where(eq(timeLogs.userId, userId))
    .orderBy(desc(timeLogs.startedAt))
    .limit(limit);
}

export async function getActiveTimer(
  userId: string,
): Promise<TimeLog | null> {
  const [active] = await db
    .select()
    .from(timeLogs)
    .where(and(eq(timeLogs.userId, userId), isNull(timeLogs.endedAt)));
  return active ?? null;
}
