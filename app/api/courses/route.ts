import { db } from "@/lib/db";
import { courses, SINGLE_USER_ID } from "@/lib/db/schema";
import { createCourseSchema } from "@/lib/validations/course";
import { and, eq, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

/**
 * Sweep any active courses whose end_date is in the past and mark them
 * completed. Cheap and idempotent — fires on every list read so courses
 * auto-close without needing a cron.
 */
async function autoCompletePastCourses() {
  await db
    .update(courses)
    .set({ status: "completed" })
    .where(
      and(
        eq(courses.userId, SINGLE_USER_ID),
        eq(courses.status, "active"),
        lt(courses.endDate, sql`CURRENT_DATE`),
      ),
    );
}

export async function GET(request: Request) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  await autoCompletePastCourses();

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  const result = workspaceId
    ? await db
        .select()
        .from(courses)
        .where(eq(courses.workspaceId, workspaceId))
        .orderBy(courses.name)
    : await db
        .select()
        .from(courses)
        .where(eq(courses.userId, SINGLE_USER_ID))
        .orderBy(courses.name);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const body = await request.json();
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [course] = await db
    .insert(courses)
    .values({ ...parsed.data, userId: SINGLE_USER_ID })
    .returning();

  return NextResponse.json(course, { status: 201 });
}
