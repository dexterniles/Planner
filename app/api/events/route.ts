import { db } from "@/lib/db";
import { events, eventCategories } from "@/lib/db/schema";
import { createEventSchema, eventStatusValues } from "@/lib/validations/event";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { autoCompletePastEvents } from "@/lib/auto-complete-events";
import { and, asc, eq, gte, lte, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

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

  await autoCompletePastEvents(userId);

  const conditions: SQL[] = [eq(events.userId, userId)];
  if (from) conditions.push(gte(events.startsAt, new Date(from)));
  if (to) conditions.push(lte(events.startsAt, new Date(to)));
  if (categoryId) conditions.push(eq(events.categoryId, categoryId));
  const statusParse = z.enum(eventStatusValues).safeParse(status);
  if (statusParse.success) {
    conditions.push(eq(events.status, statusParse.data));
  }

  const result = await db
    .select({
      id: events.id,
      userId: events.userId,
      title: events.title,
      description: events.description,
      categoryId: events.categoryId,
      categoryName: eventCategories.name,
      categoryColor: eventCategories.color,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      allDay: events.allDay,
      location: events.location,
      url: events.url,
      attendees: events.attendees,
      status: events.status,
      color: events.color,
      recurrenceRuleId: events.recurrenceRuleId,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
    })
    .from(events)
    .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .where(and(...conditions))
    .orderBy(asc(events.startsAt))
    .limit(limit);

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

  const { startsAt, endsAt, ...rest } = parsed.data;

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
