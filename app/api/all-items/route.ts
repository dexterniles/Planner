import { db } from "@/lib/db";
import { assignments, tasks, courses, projects } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const assignmentRows = await db
    .select({
      id: assignments.id,
      type: sql<string>`'assignment'`.as("type"),
      title: assignments.title,
      status: assignments.status,
      dueDate: assignments.dueDate,
      parentId: assignments.courseId,
      parentName: courses.name,
      parentColor: courses.color,
      priority: sql<string>`null`.as("priority"),
    })
    .from(assignments)
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(eq(assignments.userId, userId));

  const taskRows = await db
    .select({
      id: tasks.id,
      type: sql<string>`'task'`.as("type"),
      title: tasks.title,
      status: tasks.status,
      dueDate: tasks.dueDate,
      parentId: tasks.projectId,
      parentName: projects.name,
      parentColor: projects.color,
      priority: tasks.priority,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(tasks.userId, userId));

  const allItems = [...assignmentRows, ...taskRows].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return NextResponse.json(allItems);
}
