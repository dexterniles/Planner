import { db } from "@/lib/db";
import {
  assignments,
  tasks,
  milestones,
  courses,
  projects,
  SINGLE_USER_ID,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // format: YYYY-MM

  if (!month) {
    return NextResponse.json(
      { error: "month parameter is required (YYYY-MM)" },
      { status: 400 },
    );
  }

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const mon = parseInt(monthStr, 10);
  const startDate = new Date(year, mon - 1, 1);
  const endDate = new Date(year, mon, 1); // first of next month

  // Run all three queries in parallel instead of through the UNION view
  const [assignmentRows, taskRows, milestoneRows] = await Promise.all([
    db
      .select({
        sourceType: sql<string>`'assignment'`.as("source_type"),
        sourceId: assignments.id,
        parentId: assignments.courseId,
        userId: assignments.userId,
        workspaceId: courses.workspaceId,
        title: assignments.title,
        dueDate: assignments.dueDate,
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
        status: sql<string>`CASE WHEN ${milestones.completedAt} IS NOT NULL THEN 'done' ELSE 'pending' END`,
        color: projects.color,
      })
      .from(milestones)
      .innerJoin(projects, eq(milestones.projectId, projects.id))
      .where(eq(projects.userId, SINGLE_USER_ID)),
  ]);

  // Filter milestones in JS (date column is stored as text, not timestamp)
  const filteredMilestones = milestoneRows.filter((m) => {
    if (!m.dueDate) return false;
    const d = new Date(m.dueDate as string);
    return d >= startDate && d < endDate;
  });

  const allItems = [...assignmentRows, ...taskRows, ...filteredMilestones].sort(
    (a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return (
        new Date(a.dueDate as string).getTime() -
        new Date(b.dueDate as string).getTime()
      );
    },
  );

  return NextResponse.json(allItems);
}
