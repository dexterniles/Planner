import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { and, eq, lt, isNotNull, isNull, or } from "drizzle-orm";

/**
 * Transition any confirmed events that have already ended to "completed".
 * An event is considered past if:
 *   - ends_at is set and ends_at < now, OR
 *   - ends_at is null and starts_at < now
 * Only acts on status = 'confirmed' (leaves tentative/cancelled alone).
 */
export async function autoCompletePastEvents(userId: string): Promise<void> {
  const now = new Date();

  await db
    .update(events)
    .set({ status: "completed" })
    .where(
      and(
        eq(events.userId, userId),
        eq(events.status, "confirmed"),
        or(
          and(isNotNull(events.endsAt), lt(events.endsAt, now)),
          and(isNull(events.endsAt), lt(events.startsAt, now)),
        ),
      ),
    );
}
