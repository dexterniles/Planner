import { db } from "@/lib/db";
import { events, SINGLE_USER_ID } from "@/lib/db/schema";
import { and, asc, eq, gte, isNull, lt, lte, or } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Return all events that overlap a given calendar date.
 * ?date=YYYY-MM-DD
 *
 * Overlaps include:
 *  - Single-day events whose startsAt is on that date
 *  - Multi-day events whose startsAt <= dayEnd AND (endsAt is null OR endsAt >= dayStart)
 */
export async function GET(request: Request) {
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
    .select()
    .from(events)
    .where(
      and(
        eq(events.userId, SINGLE_USER_ID),
        lte(events.startsAt, dayEnd),
        or(
          isNull(events.endsAt),
          and(gte(events.endsAt, dayStart)),
          // Single-point events: startsAt falls inside the day
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
