import { db } from "@/lib/db";
import { assignments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type Assignment = InferSelectModel<typeof assignments>;

export type AssignmentsFilters = { courseId?: string };

export async function getAssignments(
  userId: string,
  opts: AssignmentsFilters = {},
): Promise<Assignment[]> {
  const { courseId } = opts;
  if (courseId) {
    return db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.userId, userId),
          eq(assignments.courseId, courseId),
        ),
      )
      .orderBy(assignments.dueDate);
  }
  return db
    .select()
    .from(assignments)
    .where(eq(assignments.userId, userId))
    .orderBy(assignments.dueDate);
}

export async function getAssignmentById(
  userId: string,
  id: string,
): Promise<Assignment | null> {
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.id, id), eq(assignments.userId, userId)));
  return assignment ?? null;
}
