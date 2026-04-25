import { db } from "@/lib/db";
import { assignments, SINGLE_USER_ID } from "@/lib/db/schema";
import { updateAssignmentSchema } from "@/lib/validations/assignment";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(
      and(eq(assignments.id, id), eq(assignments.userId, SINGLE_USER_ID)),
    );

  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(assignment);
}

export async function PATCH(request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  const body = await request.json();
  const parsed = updateAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dueDate, pointsEarned, pointsPossible, ...rest } = parsed.data;

  const updateData: Record<string, unknown> = { ...rest };
  if (dueDate !== undefined) {
    updateData.dueDate = dueDate ? new Date(dueDate) : null;
  }
  if (pointsEarned !== undefined) {
    updateData.pointsEarned = pointsEarned?.toString() ?? null;
  }
  if (pointsPossible !== undefined) {
    updateData.pointsPossible = pointsPossible?.toString() ?? null;
  }

  const [updated] = await db
    .update(assignments)
    .set(updateData)
    .where(
      and(eq(assignments.id, id), eq(assignments.userId, SINGLE_USER_ID)),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  const [deleted] = await db
    .delete(assignments)
    .where(
      and(eq(assignments.id, id), eq(assignments.userId, SINGLE_USER_ID)),
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
