import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { and, eq, lt, isNotNull, isNull, or } from "drizzle-orm";

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
