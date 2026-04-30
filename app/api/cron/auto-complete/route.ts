import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { autoCompletePastCourses } from "@/lib/auto-complete-courses";
import { autoCompletePastEvents } from "@/lib/auto-complete-events";
import { materializeRecurrencesForUser } from "@/lib/server/data/recurrence";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await db.execute(
    sql`SELECT DISTINCT user_id FROM courses
        UNION
        SELECT DISTINCT user_id FROM events
        UNION
        SELECT DISTINCT user_id FROM tasks
        UNION
        SELECT DISTINCT user_id FROM assignments`,
  )) as unknown as Array<{ user_id: string }>;

  const failures: Array<{ userId: string; step: string; error: string }> = [];
  for (const row of rows) {
    for (const step of [
      { name: "courses", run: () => autoCompletePastCourses(row.user_id) },
      { name: "events", run: () => autoCompletePastEvents(row.user_id) },
      {
        name: "recurrences",
        run: () => materializeRecurrencesForUser(row.user_id),
      },
    ]) {
      try {
        await step.run();
      } catch (err) {
        failures.push({
          userId: row.user_id,
          step: step.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  if (failures.length > 0) {
    console.error("[cron/auto-complete] failures", failures);
  }

  return NextResponse.json({
    ok: true,
    count: rows.length,
    failures: failures.length,
  });
}
