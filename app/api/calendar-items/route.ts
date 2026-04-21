import { db } from "@/lib/db";
import {
  assignments,
  tasks,
  milestones,
  courses,
  projects,
  events,
  SINGLE_USER_ID,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql, or, isNull, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM
  const from = searchParams.get("from"); // ISO date
  const to = searchParams.get("to"); // ISO date

  let startDate: Date;
  let endDate: Date;

  if (from && to) {
    startDate = new Date(from);
    endDate = new Date(to);
  } else if (month) {
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const mon = parseInt(monthStr, 10);
    startDate = new Date(year, mon - 1, 1);
    endDate = new Date(year, mon, 1); // first of next month
  } else {
    return NextResponse.json(
      { error: "Provide either ?month=YYYY-MM or ?from=...&to=..." },
      { status: 400 },
    );
  }

  const [assignmentRows, taskRows, milestoneRows, eventRows] = await Promise.all([
    db
      .select({
        sourceType: sql<string>`'assignment'`.as("source_type"),
        sourceId: assignments.id,
        parentId: assignments.courseId,
        userId: assignments.userId,
        workspaceId: courses.workspaceId,
        title: assignments.title,
        dueDate: assignments.dueDate,
        endDate: sql<string | null>`NULL`.as("end_date"),
        allDay: sql<boolean>`false`.as("all_day"),
        category: sql<string | null>`NULL`.as("category"),
        status: sql<string>`${assignments.status}::text`,
        color: courses.color,
      })
      .from(assignments)
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(
        and(
          eq(assignments.userId, SINGLE_USER_ID),
          gte(assignments.dueDate, startDate),
          lte(assignments.dueDate, endDate),
        ),
      ),
    db
      .select({
        sourceType: sql<string>`'task'`.as("source_type"),
        sourceId: tasks.id,
        parentId: tasks.projectId,
        userId: tasks.userId,
        workspaceId: projects.workspaceId,
        title: tasks.title,
        dueDate: tasks.dueDate,
        endDate: sql<string | null>`NULL`.as("end_date"),
        allDay: sql<boolean>`false`.as("all_day"),
        category: sql<string | null>`NULL`.as("category"),
        status: sql<string>`${tasks.status}::text`,
        color: projects.color,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(tasks.userId, SINGLE_USER_ID),
          gte(tasks.dueDate, startDate),
          lte(tasks.dueDate, endDate),
        ),
      ),
    db
      .select({
        sourceType: sql<string>`'milestone'`.as("source_type"),
        sourceId: milestones.id,
        parentId: milestones.projectId,
        userId: projects.userId,
        workspaceId: projects.workspaceId,
        title: milestones.title,
        dueDate: sql`${milestones.targetDate}::timestamptz`.as("due_date"),
        endDate: sql<string | null>`NULL`.as("end_date"),
        allDay: sql<boolean>`false`.as("all_day"),
        category: sql<string | null>`NULL`.as("category"),
        status: sql<string>`CASE WHEN ${milestones.completedAt} IS NOT NULL THEN 'done' ELSE 'pending' END`,
        color: projects.color,
      })
      .from(milestones)
      .innerJoin(projects, eq(milestones.projectId, projects.id))
      .where(eq(projects.userId, SINGLE_USER_ID)),
    db
      .select({
        sourceType: sql<string>`'event'`.as("source_type"),
        sourceId: events.id,
        parentId: events.id,
        userId: events.userId,
        workspaceId: sql<string | null>`NULL`.as("workspace_id"),
        title: events.title,
        dueDate: events.startsAt,
        endDate: events.endsAt,
        allDay: events.allDay,
        category: sql<string>`${events.category}::text`,
        status: sql<string>`${events.status}::text`,
        color: events.color,
      })
      .from(events)
      .where(
        and(
          eq(events.userId, SINGLE_USER_ID),
          or(
            and(
              gte(events.startsAt, startDate),
              lte(events.startsAt, endDate),
            ),
            and(
              isNotNull(events.endsAt),
              gte(events.endsAt, startDate),
              lte(events.endsAt, endDate),
            ),
            and(
              lte(events.startsAt, startDate),
              or(isNull(events.endsAt), gte(events.endsAt, endDate)),
            ),
          ),
        ),
      ),
  ]);

  const filteredMilestones = milestoneRows.filter((m) => {
    if (!m.dueDate) return false;
    const d = new Date(m.dueDate as string);
    return d >= startDate && d < endDate;
  });

  const allItems = [
    ...assignmentRows,
    ...taskRows,
    ...filteredMilestones,
    ...eventRows,
  ].sort((a, b) => {
    if (!a.dueDate || !b.dueDate) return 0;
    return (
      new Date(a.dueDate as string).getTime() -
      new Date(b.dueDate as string).getTime()
    );
  });

  return NextResponse.json(allItems);
}
