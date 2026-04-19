import { db } from "@/lib/db";
import { recurrenceRules, assignments, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  // Unlink from any assignments/tasks first
  await db
    .update(assignments)
    .set({ recurrenceRuleId: null })
    .where(eq(assignments.recurrenceRuleId, id));
  await db
    .update(tasks)
    .set({ recurrenceRuleId: null })
    .where(eq(tasks.recurrenceRuleId, id));

  const [deleted] = await db
    .delete(recurrenceRules)
    .where(eq(recurrenceRules.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
