import { db } from "@/lib/db";
import { gradeCategories } from "@/lib/db/schema";
import { createGradeCategorySchema } from "@/lib/validations/grade-category";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return NextResponse.json(
      { error: "courseId is required" },
      { status: 400 },
    );
  }

  const result = await db
    .select()
    .from(gradeCategories)
    .where(eq(gradeCategories.courseId, courseId))
    .orderBy(gradeCategories.name);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const body = await request.json();
  const parsed = createGradeCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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
