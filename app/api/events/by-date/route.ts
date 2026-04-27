import { db } from "@/lib/db";
import { events, eventCategories } from "@/lib/db/schema";
import { and, asc, eq, gte, isNull, lt, lte, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "date parameter is required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const [y, m, d] = date.split("-").map((n) => parseInt(n, 10));
  const dayStart = new Date(y, m - 1, d, 0, 0, 0);
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

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
    })
    .from(events)
    .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .where(
      and(
        eq(events.userId, userId),
        lte(events.startsAt, dayEnd),
        or(
          isNull(events.endsAt),
          and(gte(events.endsAt, dayStart)),
          and(
            gte(events.startsAt, dayStart),
            lt(events.startsAt, dayEnd),
          ),
        ),
      ),
    )
    .orderBy(asc(events.startsAt));

  return NextResponse.json(result);
}
