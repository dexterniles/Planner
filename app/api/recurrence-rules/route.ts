import { db } from "@/lib/db";
import { recurrenceRules, assignments, tasks, events } from "@/lib/db/schema";
import { createRecurrenceRuleSchema } from "@/lib/validations/recurrence";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createRecurrenceRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [rule] = await db
    .insert(recurrenceRules)
    .values(parsed.data)
    .returning();

  // Link the rule to the owner
  if (parsed.data.ownerType === "assignment") {
    await db
      .update(assignments)
      .set({ recurrenceRuleId: rule.id })
      .where(eq(assignments.id, parsed.data.ownerId));
  } else if (parsed.data.ownerType === "task") {
    await db
      .update(tasks)
      .set({ recurrenceRuleId: rule.id })
      .where(eq(tasks.id, parsed.data.ownerId));
  } else {
    await db
      .update(events)
      .set({ recurrenceRuleId: rule.id })
      .where(eq(events.id, parsed.data.ownerId));
  }

  return NextResponse.json(rule, { status: 201 });
}
