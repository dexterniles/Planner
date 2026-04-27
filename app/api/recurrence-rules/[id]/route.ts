import { db } from "@/lib/db";
import {
  recurrenceRules,
  assignments,
  tasks,
  events,
  bills,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

async function userOwnsRule(ruleId: string, userId: string): Promise<boolean> {
  const [a] = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(
      and(
        eq(assignments.recurrenceRuleId, ruleId),
        eq(assignments.userId, userId),
      ),
    );
  if (a) return true;

  const [t] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.recurrenceRuleId, ruleId), eq(tasks.userId, userId)));
  if (t) return true;

  const [e] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.recurrenceRuleId, ruleId), eq(events.userId, userId)));
  if (e) return true;

  const [b] = await db
    .select({ id: bills.id })
    .from(bills)
    .where(and(eq(bills.recurrenceRuleId, ruleId), eq(bills.userId, userId)));
  if (b) return true;

  return false;
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;

  if (!(await userOwnsRule(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(assignments)
    .set({ recurrenceRuleId: null })
    .where(
      and(
        eq(assignments.recurrenceRuleId, id),
        eq(assignments.userId, userId),
      ),
    );
  await db
    .update(tasks)
    .set({ recurrenceRuleId: null })
    .where(and(eq(tasks.recurrenceRuleId, id), eq(tasks.userId, userId)));
  await db
    .update(events)
    .set({ recurrenceRuleId: null })
    .where(and(eq(events.recurrenceRuleId, id), eq(events.userId, userId)));
  await db
    .update(bills)
    .set({ recurrenceRuleId: null })
    .where(and(eq(bills.recurrenceRuleId, id), eq(bills.userId, userId)));

  const [deleted] = await db
    .delete(recurrenceRules)
    .where(eq(recurrenceRules.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
