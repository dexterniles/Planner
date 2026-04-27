import { db } from "@/lib/db";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const weekStart = startOfWeek();
  const now = new Date();

  const result = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM courses WHERE user_id = ${userId} AND status = 'active') AS active_courses,
      (SELECT count(*)::int FROM projects WHERE user_id = ${userId} AND status IN ('planning','active')) AS active_projects,
      (SELECT count(*)::int FROM assignments WHERE user_id = ${userId} AND due_date IS NOT NULL AND due_date < ${now} AND status NOT IN ('submitted','graded')) AS overdue_assignments,
      (SELECT count(*)::int FROM tasks WHERE user_id = ${userId} AND due_date IS NOT NULL AND due_date < ${now} AND status NOT IN ('done','cancelled')) AS overdue_tasks,
      (SELECT COALESCE(SUM(duration_seconds), 0)::int FROM time_logs WHERE user_id = ${userId} AND started_at >= ${weekStart} AND duration_seconds IS NOT NULL) AS week_seconds
  `);

  const row = result[0] as {
    active_courses: number;
    active_projects: number;
    overdue_assignments: number;
    overdue_tasks: number;
    week_seconds: number;
  };

  const hoursThisWeek = row.week_seconds / 3600;

  return NextResponse.json({
    activeCourses: row.active_courses,
    activeProjects: row.active_projects,
    overdueCount: row.overdue_assignments + row.overdue_tasks,
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
  });
}
