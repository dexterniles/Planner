import { db } from "@/lib/db";
import { events, SINGLE_USER_ID } from "@/lib/db/schema";
import { createEventSchema } from "@/lib/validations/event";
import type {
  EventCategory,
  EventStatus,
} from "@/lib/validations/event";
import { and, asc, eq, gte, lte, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "500", 10);

  const conditions: SQL[] = [eq(events.userId, SINGLE_USER_ID)];
  if (from) conditions.push(gte(events.startsAt, new Date(from)));
  if (to) conditions.push(lte(events.startsAt, new Date(to)));
  if (category) conditions.push(eq(events.category, category as EventCategory));
  if (status) conditions.push(eq(events.status, status as EventStatus));

  const result = await db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(asc(events.startsAt))
    .limit(limit);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
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
      userId: SINGLE_USER_ID,
    })
    .returning();

  return NextResponse.json(event, { status: 201 });
}
