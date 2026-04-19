import { db } from "@/lib/db";
import { tasks, SINGLE_USER_ID } from "@/lib/db/schema";
import { createTaskSchema } from "@/lib/validations/task";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const result = projectId
    ? await db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .orderBy(tasks.createdAt)
    : await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, SINGLE_USER_ID))
        .orderBy(tasks.createdAt);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dueDate, ...rest } = parsed.data;

  const [task] = await db
    .insert(tasks)
    .values({
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: SINGLE_USER_ID,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
