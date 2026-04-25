import { db } from "@/lib/db";
import { events, eventCategories, SINGLE_USER_ID } from "@/lib/db/schema";
import { autoCompletePastEvents } from "@/lib/auto-complete-events";
import { and, asc, eq, gte, isNotNull, ne, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);
  const now = new Date();

  // Transition past events to 'completed' before returning
  await autoCompletePastEvents();

  // Upcoming = starts_at >= now, OR (ends_at >= now if present — i.e. currently happening)
  // Exclude cancelled and completed events
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
        eq(events.userId, SINGLE_USER_ID),
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
