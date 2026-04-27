import { db } from "@/lib/db";
import { gradeCategories, courses } from "@/lib/db/schema";
import { updateGradeCategorySchema } from "@/lib/validations/grade-category";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

async function userOwnsCategory(id: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: gradeCategories.id })
    .from(gradeCategories)
    .innerJoin(courses, eq(gradeCategories.courseId, courses.id))
    .where(and(eq(gradeCategories.id, id), eq(courses.userId, userId)));
  return !!row;
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  if (!(await userOwnsCategory(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json();
  const parsed = updateGradeCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.weight !== undefined) {
    updateData.weight = parsed.data.weight.toString();
  }

  const [updated] = await db
    .update(gradeCategories)
    .set(updateData)
    .where(eq(gradeCategories.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  if (!(await userOwnsCategory(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [deleted] = await db
    .delete(gradeCategories)
    .where(eq(gradeCategories.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
