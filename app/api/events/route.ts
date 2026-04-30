import { db } from "@/lib/db";
import { events, recurrenceRules } from "@/lib/db/schema";
import { createEventSchema, eventStatusValues } from "@/lib/validations/event";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getEvents } from "@/lib/server/data/events";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "500", 10);

  const statusParse = z.enum(eventStatusValues).safeParse(status);

  const result = await getEvents(userId, {
    from: from ?? undefined,
    to: to ?? undefined,
    categoryId: categoryId ?? undefined,
    status: statusParse.success ? statusParse.data : undefined,
    limit,
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { startsAt, endsAt, recurrence, ...rest } = parsed.data;

  if (!recurrence) {
    const [event] = await db
      .insert(events)
      .values({
        ...rest,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        userId,
      })
      .returning();
    return NextResponse.json(event, { status: 201 });
  }

  const event = await db.transaction(async (tx) => {
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
      .insert(events)
      .values({
        ...rest,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        recurrenceRuleId: rule.id,
        userId,
      })
      .returning();
    return inserted;
  });

  return NextResponse.json(event, { status: 201 });
}
