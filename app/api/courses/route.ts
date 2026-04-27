import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { createCourseSchema } from "@/lib/validations/course";
import { and, eq, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

async function autoCompletePastCourses(userId: string) {
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

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  await autoCompletePastCourses(userId);

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  const result = workspaceId
    ? await db
        .select()
        .from(courses)
        .where(
          and(
            eq(courses.userId, userId),
            eq(courses.workspaceId, workspaceId),
          ),
        )
        .orderBy(courses.name)
    : await db
        .select()
        .from(courses)
        .where(eq(courses.userId, userId))
        .orderBy(courses.name);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [course] = await db
    .insert(courses)
    .values({ ...parsed.data, userId })
    .returning();

  return NextResponse.json(course, { status: 201 });
}
