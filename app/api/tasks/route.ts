import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { createTaskSchema } from "@/lib/validations/task";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getTasks } from "@/lib/server/data/tasks";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const result = await getTasks(userId, {
    projectId: projectId ?? undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
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
      userId,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
