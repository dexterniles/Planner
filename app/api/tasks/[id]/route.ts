import { db } from "@/lib/db";
import { tasks, SINGLE_USER_ID } from "@/lib/db/schema";
import { updateTaskSchema } from "@/lib/validations/task";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, SINGLE_USER_ID)));

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dueDate, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (dueDate !== undefined) {
    updateData.dueDate = dueDate ? new Date(dueDate) : null;
  }

  const [updated] = await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, id), eq(tasks.userId, SINGLE_USER_ID)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const [deleted] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, SINGLE_USER_ID)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
