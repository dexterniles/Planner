import { db } from "@/lib/db";
import {
  courses,
  projects,
  assignments,
  tasks,
  SINGLE_USER_ID,
} from "@/lib/db/schema";
import { eq, ilike, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const pattern = `%${q}%`;

  const [courseResults, projectResults, assignmentResults, taskResults] =
    await Promise.all([
      db
        .select({
          id: courses.id,
          type: sql<string>`'course'`.as("type"),
          title: courses.name,
          subtitle: courses.code,
          color: courses.color,
          parentId: sql<string>`null`.as("parent_id"),
        })
        .from(courses)
        .where(
          eq(courses.userId, SINGLE_USER_ID),
        )
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
        })
        .from(projects)
        .where(eq(projects.userId, SINGLE_USER_ID))
        .then((rows) =>
          rows.filter((r) =>
            r.title.toLowerCase().includes(q.toLowerCase()),
          ),
        ),
      db
        .select({
          id: assignments.id,
          type: sql<string>`'assignment'`.as("type"),
          title: assignments.title,
          subtitle: courses.name,
          color: courses.color,
          parentId: assignments.courseId,
        })
        .from(assignments)
        .innerJoin(courses, eq(assignments.courseId, courses.id))
        .where(eq(assignments.userId, SINGLE_USER_ID))
        .then((rows) =>
          rows.filter((r) =>
            r.title.toLowerCase().includes(q.toLowerCase()),
          ),
        ),
      db
        .select({
          id: tasks.id,
          type: sql<string>`'task'`.as("type"),
          title: tasks.title,
          subtitle: projects.name,
          color: projects.color,
          parentId: tasks.projectId,
        })
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .where(eq(tasks.userId, SINGLE_USER_ID))
        .then((rows) =>
          rows.filter((r) =>
            r.title.toLowerCase().includes(q.toLowerCase()),
          ),
        ),
    ]);

  const results = [
    ...courseResults,
    ...projectResults,
    ...assignmentResults,
    ...taskResults,
  ].slice(0, 20);

  return NextResponse.json(results);
}
