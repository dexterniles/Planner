import { db } from "@/lib/db";
import {
  recurrenceRules,
  assignments,
  tasks,
  events,
  bills,
} from "@/lib/db/schema";
import { createRecurrenceRuleSchema } from "@/lib/validations/recurrence";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createRecurrenceRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ownerType, ownerId } = parsed.data;
  let ownerExists = false;
  if (ownerType === "assignment") {
    const [row] = await db
      .select({ id: assignments.id })
      .from(assignments)
      .where(and(eq(assignments.id, ownerId), eq(assignments.userId, userId)));
    ownerExists = !!row;
  } else if (ownerType === "task") {
    const [row] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, ownerId), eq(tasks.userId, userId)));
    ownerExists = !!row;
  } else if (ownerType === "event") {
    const [row] = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, ownerId), eq(events.userId, userId)));
    ownerExists = !!row;
  } else {
    const [row] = await db
      .select({ id: bills.id })
      .from(bills)
      .where(and(eq(bills.id, ownerId), eq(bills.userId, userId)));
    ownerExists = !!row;
  }

  if (!ownerExists) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }

  const [rule] = await db
    .insert(recurrenceRules)
    .values({
      frequency: parsed.data.frequency,
      interval: parsed.data.interval,
      daysOfWeek: parsed.data.daysOfWeek ?? null,
      endDate: parsed.data.endDate ?? null,
      count: parsed.data.count ?? null,
    })
    .returning();

  if (ownerType === "assignment") {
    await db
      .update(assignments)
      .set({ recurrenceRuleId: rule.id })
      .where(and(eq(assignments.id, ownerId), eq(assignments.userId, userId)));
  } else if (ownerType === "task") {
    await db
      .update(tasks)
      .set({ recurrenceRuleId: rule.id })
      .where(and(eq(tasks.id, ownerId), eq(tasks.userId, userId)));
  } else if (ownerType === "event") {
    await db
      .update(events)
      .set({ recurrenceRuleId: rule.id })
      .where(and(eq(events.id, ownerId), eq(events.userId, userId)));
  } else {
    await db
      .update(bills)
      .set({ recurrenceRuleId: rule.id })
      .where(and(eq(bills.id, ownerId), eq(bills.userId, userId)));
  }

  return NextResponse.json(rule, { status: 201 });
}
