import { db } from "@/lib/db";
import { gradeCategories, courses } from "@/lib/db/schema";
import { createGradeCategorySchema } from "@/lib/validations/grade-category";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId is required" },
      { status: 400 },
    );
  }

  const result = await db
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

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createGradeCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(eq(courses.id, parsed.data.courseId), eq(courses.userId, userId)),
    );
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const [category] = await db
    .insert(gradeCategories)
    .values({
      ...parsed.data,
      weight: parsed.data.weight.toString(),
    })
    .returning();

  return NextResponse.json(category, { status: 201 });
}
