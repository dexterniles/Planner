import { db } from "@/lib/db";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  courses,
  projects,
  assignments,
  tasks,
  events,
  eventCategories,
  bills,
  billCategories,
  recipes,
} from "@/lib/db/schema";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { escapeLike } from "@/lib/utils";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const pattern = `%${escapeLike(q)}%`;

  const [
    courseResults,
    projectResults,
    assignmentResults,
    taskResults,
    eventResults,
    billResults,
    recipeResults,
  ] = await Promise.all([
    db
      .select({
        id: courses.id,
        type: sql<string>`'course'`.as("type"),
        title: courses.name,
        subtitle: courses.code,
        color: courses.color,
        parentId: sql<string>`null`.as("parent_id"),
        category: sql<string | null>`null`.as("category"),
      })
      .from(courses)
      .where(
        and(
          eq(courses.userId, userId),
          or(ilike(courses.name, pattern), ilike(courses.code, pattern)),
        ),
      )
      .limit(5),
    db
      .select({
        id: projects.id,
        type: sql<string>`'project'`.as("type"),
        title: projects.name,
        subtitle: projects.description,
        color: projects.color,
        parentId: sql<string>`null`.as("parent_id"),
        category: sql<string | null>`null`.as("category"),
      })
      .from(projects)
      .where(and(eq(projects.userId, userId), ilike(projects.name, pattern)))
      .limit(5),
    db
      .select({
        id: assignments.id,
        type: sql<string>`'assignment'`.as("type"),
        title: assignments.title,
        subtitle: courses.name,
        color: courses.color,
        parentId: assignments.courseId,
        category: sql<string | null>`null`.as("category"),
      })
      .from(assignments)
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(
        and(eq(assignments.userId, userId), ilike(assignments.title, pattern)),
      )
      .limit(5),
    db
      .select({
        id: tasks.id,
        type: sql<string>`'task'`.as("type"),
        title: tasks.title,
        subtitle: projects.name,
        color: projects.color,
        parentId: tasks.projectId,
        category: sql<string | null>`null`.as("category"),
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(tasks.userId, userId), ilike(tasks.title, pattern)))
      .limit(5),
    db
      .select({
        id: events.id,
        type: sql<string>`'event'`.as("type"),
        title: events.title,
        subtitle: events.location,
        color: sql<string | null>`COALESCE(${events.color}, ${eventCategories.color})`.as(
          "color",
        ),
        parentId: events.id,
        category: eventCategories.name,
      })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .where(
        and(
          eq(events.userId, userId),
          or(ilike(events.title, pattern), ilike(events.location, pattern)),
        ),
      )
      .limit(5),
    db
      .select({
        id: bills.id,
        type: sql<string>`'bill'`.as("type"),
        title: bills.name,
        subtitle: billCategories.name,
        color: billCategories.color,
        parentId: bills.id,
        category: sql<string | null>`null`.as("category"),
      })
      .from(bills)
      .leftJoin(billCategories, eq(bills.categoryId, billCategories.id))
      .where(and(eq(bills.userId, userId), ilike(bills.name, pattern)))
      .limit(5),
    db
      .select({
        id: recipes.id,
        type: sql<string>`'recipe'`.as("type"),
        title: recipes.title,
        subtitle: recipes.description,
        color: sql<string | null>`null`.as("color"),
        parentId: recipes.id,
        category: sql<string | null>`null`.as("category"),
      })
      .from(recipes)
      .where(and(eq(recipes.userId, userId), ilike(recipes.title, pattern)))
      .limit(5),
  ]);

  const results = [
    ...courseResults,
    ...projectResults,
    ...assignmentResults,
    ...taskResults,
    ...eventResults,
    ...billResults,
    ...recipeResults,
  ].slice(0, 20);

  return NextResponse.json(results);
}
