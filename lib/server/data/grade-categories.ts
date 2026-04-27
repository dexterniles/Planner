import { db } from "@/lib/db";
import { gradeCategories, courses } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export type GradeCategoryRow = {
  id: string;
  courseId: string;
  name: string;
  weight: string;
  dropLowestN: number;
};

export async function getGradeCategories(
  userId: string,
  courseId: string,
): Promise<GradeCategoryRow[]> {
  return db
    .select({
      id: gradeCategories.id,
      courseId: gradeCategories.courseId,
      name: gradeCategories.name,
      weight: gradeCategories.weight,
      dropLowestN: gradeCategories.dropLowestN,
    })
    .from(gradeCategories)
    .innerJoin(courses, eq(gradeCategories.courseId, courses.id))
    .where(
      and(eq(courses.userId, userId), eq(gradeCategories.courseId, courseId)),
    )
    .orderBy(gradeCategories.name);
}
