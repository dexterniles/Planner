import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";

export async function autoCompletePastCourses(userId: string): Promise<void> {
  await db
    .update(courses)
    .set({ status: "completed" })
    .where(
      and(
        eq(courses.userId, userId),
        eq(courses.status, "active"),
        lt(courses.endDate, sql`CURRENT_DATE`),
      ),
    );
}
