import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type Course = InferSelectModel<typeof courses>;

export type CoursesFilters = { workspaceId?: string };

export async function getCourses(
  userId: string,
  opts: CoursesFilters = {},
): Promise<Course[]> {
  const { workspaceId } = opts;
  if (workspaceId) {
    return db
      .select()
      .from(courses)
      .where(
        and(eq(courses.userId, userId), eq(courses.workspaceId, workspaceId)),
      )
      .orderBy(courses.name);
  }
  return db
    .select()
    .from(courses)
    .where(eq(courses.userId, userId))
    .orderBy(courses.name);
}

export async function getCourseById(
  userId: string,
  courseId: string,
): Promise<Course | null> {
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.userId, userId)));
  return course ?? null;
}
