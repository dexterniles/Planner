import { db } from "@/lib/db";
import { recurrenceRules, assignments, tasks, events, bills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;

  // Unlink from any assignments/tasks/events/bills first
  await db
    .update(assignments)
    .set({ recurrenceRuleId: null })
    .where(eq(assignments.recurrenceRuleId, id));
  await db
    .update(tasks)
    .set({ recurrenceRuleId: null })
    .where(eq(tasks.recurrenceRuleId, id));
  await db
    .update(events)
    .set({ recurrenceRuleId: null })
    .where(eq(events.recurrenceRuleId, id));
  await db
    .update(bills)
    .set({ recurrenceRuleId: null })
    .where(eq(bills.recurrenceRuleId, id));

  const [deleted] = await db
    .delete(recurrenceRules)
    .where(eq(recurrenceRules.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
