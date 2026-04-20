import { db } from "@/lib/db";
import { events, SINGLE_USER_ID } from "@/lib/db/schema";
import { and, eq, lt, isNotNull, isNull, or } from "drizzle-orm";

/**
 * Transition any confirmed events that have already ended to "completed".
 * An event is considered past if:
 *   - ends_at is set and ends_at < now, OR
 *   - ends_at is null and starts_at < now
 * Only acts on status = 'confirmed' (leaves tentative/cancelled alone).
 *
 * Cheap — single UPDATE query. Safe to call before any read.
 */
export async function autoCompletePastEvents(): Promise<void> {
  const now = new Date();

  await db
    .update(events)
    .set({ status: "completed" })
    .where(
      and(
        eq(events.userId, SINGLE_USER_ID),
        eq(events.status, "confirmed"),
        or(
          and(isNotNull(events.endsAt), lt(events.endsAt, now)),
          and(isNull(events.endsAt), lt(events.startsAt, now)),
        ),
      ),
    );
}
