import { db } from "@/lib/db";
import { tasks, recurrenceRules } from "@/lib/db/schema";
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

  const { dueDate, recurrence, ...rest } = parsed.data;

  if (!recurrence) {
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

  const task = await db.transaction(async (tx) => {
    const [rule] = await tx
      .insert(recurrenceRules)
      .values({
        frequency: recurrence.frequency,
        interval: recurrence.interval ?? 1,
        daysOfWeek: recurrence.daysOfWeek ?? null,
        endDate: recurrence.endDate ?? null,
        count: recurrence.count ?? null,
      })
      .returning();

    const [inserted] = await tx
      .insert(tasks)
      .values({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        recurrenceRuleId: rule.id,
        userId,
      })
      .returning();
    return inserted;
  });

  return NextResponse.json(task, { status: 201 });
}
