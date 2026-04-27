import { db } from "@/lib/db";
import {
  assignments,
  tasks,
  milestones,
  courses,
  projects,
  events,
  eventCategories,
  bills,
  billCategories,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql, or, isNull, isNotNull } from "drizzle-orm";

export type CalendarItem = Record<string, unknown>;

async function getCalendarItems(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<CalendarItem[]> {
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  const [assignmentRows, taskRows, milestoneRows, eventRows, billRows] =
    await Promise.all([
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
            eq(assignments.userId, userId),
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
            eq(tasks.userId, userId),
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
        .where(
          and(
            eq(projects.userId, userId),
            gte(milestones.targetDate, startStr),
            lte(milestones.targetDate, endStr),
          ),
        ),
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
          category: eventCategories.name,
          status: sql<string>`${events.status}::text`,
          color: sql<
            string | null
          >`COALESCE(${events.color}, ${eventCategories.color})`.as("color"),
        })
        .from(events)
        .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
        .where(
          and(
            eq(events.userId, userId),
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
      db
        .select({
          sourceType: sql<string>`'bill'`.as("source_type"),
          sourceId: bills.id,
          parentId: bills.id,
          userId: bills.userId,
          workspaceId: sql<string | null>`NULL`.as("workspace_id"),
          title: bills.name,
          dueDate: sql<string>`${bills.dueDate}::text`.as("due_date"),
          endDate: sql<string | null>`NULL`.as("end_date"),
          allDay: sql<boolean>`true`.as("all_day"),
          category: billCategories.name,
          status: sql<string>`${bills.status}::text`,
          color: billCategories.color,
          amount: bills.amount,
        })
        .from(bills)
        .leftJoin(billCategories, eq(bills.categoryId, billCategories.id))
        .where(
          and(
            eq(bills.userId, userId),
            gte(bills.dueDate, startStr),
            lte(bills.dueDate, endStr),
          ),
        ),
    ]);

  const filteredMilestones = milestoneRows.filter((m) => {
    if (!m.dueDate) return false;
    const d = new Date(m.dueDate as string);
    return d >= startDate && d < endDate;
  });

  return [
    ...(assignmentRows as Record<string, unknown>[]),
    ...(taskRows as Record<string, unknown>[]),
    ...(filteredMilestones as Record<string, unknown>[]),
    ...(eventRows as Record<string, unknown>[]),
    ...(billRows as Record<string, unknown>[]),
  ].sort((a, b) => {
    if (!a.dueDate || !b.dueDate) return 0;
    return (
      new Date(a.dueDate as string).getTime() -
      new Date(b.dueDate as string).getTime()
    );
  });
}

export async function getCalendarItemsRange(
  userId: string,
  from: string,
  to: string,
): Promise<CalendarItem[]> {
  return getCalendarItems(userId, new Date(from), new Date(to));
}

export async function getCalendarItemsMonth(
  userId: string,
  month: { year: number; month: number },
): Promise<CalendarItem[]> {
  const startDate = new Date(month.year, month.month - 1, 1);
  const endDate = new Date(month.year, month.month, 1);
  return getCalendarItems(userId, startDate, endDate);
}
