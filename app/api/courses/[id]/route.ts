import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { updateCourseSchema } from "@/lib/validations/course";
import { and, eq, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;

  await db
    .update(courses)
    .set({ status: "completed" })
    .where(
      and(
        eq(courses.id, id),
        eq(courses.userId, userId),
        eq(courses.status, "active"),
        lt(courses.endDate, sql`CURRENT_DATE`),
      ),
    );

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)));

  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(course);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  const body = await request.json();
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(courses)
    .set(parsed.data)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)))
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
  const [deleted] = await db
    .delete(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
