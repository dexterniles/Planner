import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { createCourseSchema } from "@/lib/validations/course";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getCourses } from "@/lib/server/data/courses";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  const result = await getCourses(userId, {
    workspaceId: workspaceId ?? undefined,
  });
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
