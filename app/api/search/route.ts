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
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

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
      .where(eq(courses.userId, userId))
      .then((rows) =>
        rows.filter(
          (r) =>
            r.title.toLowerCase().includes(q.toLowerCase()) ||
            (r.subtitle && r.subtitle.toLowerCase().includes(q.toLowerCase())),
        ),
      ),
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
      .where(eq(projects.userId, userId))
      .then((rows) =>
        rows.filter((r) => r.title.toLowerCase().includes(q.toLowerCase())),
      ),
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
      .where(eq(assignments.userId, userId))
      .then((rows) =>
        rows.filter((r) => r.title.toLowerCase().includes(q.toLowerCase())),
      ),
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
      .where(eq(tasks.userId, userId))
      .then((rows) =>
        rows.filter((r) => r.title.toLowerCase().includes(q.toLowerCase())),
      ),
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
      .where(eq(events.userId, userId))
      .then((rows) =>
        rows.filter(
          (r) =>
            r.title.toLowerCase().includes(q.toLowerCase()) ||
            (r.subtitle && r.subtitle.toLowerCase().includes(q.toLowerCase())),
        ),
      ),
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
      .where(eq(bills.userId, userId))
      .then((rows) =>
        rows.filter((r) => r.title.toLowerCase().includes(q.toLowerCase())),
      ),
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
      .where(eq(recipes.userId, userId))
      .then((rows) =>
        rows.filter((r) => r.title.toLowerCase().includes(q.toLowerCase())),
      ),
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
