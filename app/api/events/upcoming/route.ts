import { db } from "@/lib/db";
import { events, eventCategories } from "@/lib/db/schema";
import { autoCompletePastEvents } from "@/lib/auto-complete-events";
import { and, asc, eq, gte, isNotNull, ne, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);
  const now = new Date();

  await autoCompletePastEvents(userId);

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
        ne(events.status, "cancelled"),
        or(
          gte(events.startsAt, now),
          and(isNotNull(events.endsAt), gte(events.endsAt, now)),
        ),
      ),
    )
    .orderBy(asc(events.startsAt))
    .limit(limit);

  return NextResponse.json(result);
}
