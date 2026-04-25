import { db } from "@/lib/db";
import { courses, SINGLE_USER_ID } from "@/lib/db/schema";
import { updateCourseSchema } from "@/lib/validations/course";
import { and, eq, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  // Auto-complete this course if its end date has passed and it's still active.
  // Idempotent — runs on every detail read, matching the behaviour of the list.
  await db
    .update(courses)
    .set({ status: "completed" })
    .where(
      and(
        eq(courses.id, id),
        eq(courses.userId, SINGLE_USER_ID),
        eq(courses.status, "active"),
        lt(courses.endDate, sql`CURRENT_DATE`),
      ),
    );

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, SINGLE_USER_ID)));

  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(course);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(courses)
    .set(parsed.data)
    .where(and(eq(courses.id, id), eq(courses.userId, SINGLE_USER_ID)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const [deleted] = await db
    .delete(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, SINGLE_USER_ID)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
