import { db } from "@/lib/db";
import { assignments, recurrenceRules } from "@/lib/db/schema";
import { createAssignmentSchema } from "@/lib/validations/assignment";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getAssignments } from "@/lib/server/data/assignments";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  const result = await getAssignments(userId, {
    courseId: courseId ?? undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dueDate, recurrence, ...rest } = parsed.data;

  if (!recurrence) {
    const [assignment] = await db
      .insert(assignments)
      .values({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        pointsEarned: rest.pointsEarned?.toString() ?? null,
        pointsPossible: rest.pointsPossible?.toString() ?? null,
        userId,
      })
      .returning();
    return NextResponse.json(assignment, { status: 201 });
  }

  const assignment = await db.transaction(async (tx) => {
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
      .insert(assignments)
      .values({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : null,
        pointsEarned: rest.pointsEarned?.toString() ?? null,
        pointsPossible: rest.pointsPossible?.toString() ?? null,
        recurrenceRuleId: rule.id,
        userId,
      })
      .returning();
    return inserted;
  });

  return NextResponse.json(assignment, { status: 201 });
}
