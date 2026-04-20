import { db } from "@/lib/db";
import {
  courses,
  projects,
  assignments,
  tasks,
  timeLogs,
  SINGLE_USER_ID,
} from "@/lib/db/schema";
import { and, eq, gte, inArray, isNotNull, lt, not, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function GET() {
  const weekStart = startOfWeek();
  const now = new Date();

  const [
    activeCourseRows,
    activeProjectRows,
    overdueAssignmentRows,
    overdueTaskRows,
    weekTimeRows,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(courses)
      .where(and(eq(courses.userId, SINGLE_USER_ID), eq(courses.status, "active"))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(
        and(
          eq(projects.userId, SINGLE_USER_ID),
          inArray(projects.status, ["planning", "active"]),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(assignments)
      .where(
        and(
          eq(assignments.userId, SINGLE_USER_ID),
          isNotNull(assignments.dueDate),
          lt(assignments.dueDate, now),
          not(inArray(assignments.status, ["submitted", "graded"])),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, SINGLE_USER_ID),
          isNotNull(tasks.dueDate),
          lt(tasks.dueDate, now),
          not(inArray(tasks.status, ["done", "cancelled"])),
        ),
      ),
    db
      .select({
        total: sql<number>`COALESCE(SUM(${timeLogs.durationSeconds}), 0)::int`,
      })
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.userId, SINGLE_USER_ID),
          gte(timeLogs.startedAt, weekStart),
          isNotNull(timeLogs.durationSeconds),
        ),
      ),
  ]);

  const hoursThisWeek = (weekTimeRows[0]?.total ?? 0) / 3600;

  return NextResponse.json({
    activeCourses: activeCourseRows[0]?.count ?? 0,
    activeProjects: activeProjectRows[0]?.count ?? 0,
    overdueCount:
      (overdueAssignmentRows[0]?.count ?? 0) +
      (overdueTaskRows[0]?.count ?? 0),
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
  });
}
