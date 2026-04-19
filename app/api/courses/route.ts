import { db } from "@/lib/db";
import { courses, SINGLE_USER_ID } from "@/lib/db/schema";
import { createCourseSchema } from "@/lib/validations/course";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  const query = db
    .select()
    .from(courses)
    .where(eq(courses.userId, SINGLE_USER_ID))
    .orderBy(courses.name);

  const result = workspaceId
    ? await db
        .select()
        .from(courses)
        .where(eq(courses.workspaceId, workspaceId))
        .orderBy(courses.name)
    : await query;

  return NextResponse.json(result);
}

export async function POST(request: Request) {
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
