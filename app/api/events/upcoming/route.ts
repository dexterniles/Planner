import { db } from "@/lib/db";
import { events, SINGLE_USER_ID } from "@/lib/db/schema";
import { and, asc, eq, gte, ne, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);
  const now = new Date();

  // Upcoming = starts_at >= now, OR (ends_at >= now if present — i.e. currently happening)
  // Exclude cancelled events
  const result = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.userId, SINGLE_USER_ID),
        ne(events.status, "cancelled"),
        or(
          gte(events.startsAt, now),
          sql`${events.endsAt} IS NOT NULL AND ${events.endsAt} >= ${now}`,
        ),
      ),
    )
    .orderBy(asc(events.startsAt))
    .limit(limit);

  return NextResponse.json(result);
}
