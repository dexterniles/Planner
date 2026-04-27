import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { autoCompletePastCourses } from "@/lib/auto-complete-courses";
import { autoCompletePastEvents } from "@/lib/auto-complete-events";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await db.execute(
    sql`SELECT DISTINCT user_id FROM courses
        UNION
        SELECT DISTINCT user_id FROM events`,
  )) as unknown as Array<{ user_id: string }>;

  for (const row of rows) {
    await autoCompletePastCourses(row.user_id);
    await autoCompletePastEvents(row.user_id);
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
