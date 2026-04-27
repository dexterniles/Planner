import { db } from "@/lib/db";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  workspaces,
  courses,
  assignments,
  gradeCategories,
  projects,
  tasks,
  milestones,
  timeLogs,
  tags,
  inboxItems,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  const [
    workspaceRows,
    courseRows,
    assignmentRows,
    projectRows,
    taskRows,
    timeLogRows,
    tagRows,
    inboxRows,
  ] = await Promise.all([
    db.select().from(workspaces).where(eq(workspaces.userId, userId)),
    db.select().from(courses).where(eq(courses.userId, userId)),
    db.select().from(assignments).where(eq(assignments.userId, userId)),
    db.select().from(projects).where(eq(projects.userId, userId)),
    db.select().from(tasks).where(eq(tasks.userId, userId)),
    db.select().from(timeLogs).where(eq(timeLogs.userId, userId)),
    db.select().from(tags).where(eq(tags.userId, userId)),
    db.select().from(inboxItems).where(eq(inboxItems.userId, userId)),
  ]);

  const courseIds = courseRows.map((c) => c.id);
  const projectIds = projectRows.map((p) => p.id);

  const [gradeCategoryRows, milestoneRows] = await Promise.all([
    courseIds.length
      ? db
          .select()
          .from(gradeCategories)
          .where(inArray(gradeCategories.courseId, courseIds))
      : Promise.resolve([] as (typeof gradeCategories.$inferSelect)[]),
    projectIds.length
      ? db
          .select()
          .from(milestones)
          .where(inArray(milestones.projectId, projectIds))
      : Promise.resolve([] as (typeof milestones.$inferSelect)[]),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    workspaces: workspaceRows,
    courses: courseRows,
    assignments: assignmentRows,
    gradeCategories: gradeCategoryRows,
    projects: projectRows,
    tasks: taskRows,
    milestones: milestoneRows,
    timeLogs: timeLogRows,
    tags: tagRows,
    inboxItems: inboxRows,
  };

  if (format === "csv") {
    const rows = [
      ["type", "name", "status", "due_date", "parent", "created_at"],
      ...assignmentRows.map((a) => {
        const course = courseRows.find((c) => c.id === a.courseId);
        return [
          "assignment",
          a.title,
          a.status,
          a.dueDate?.toISOString() ?? "",
          course?.name ?? "",
          a.createdAt.toISOString(),
        ];
      }),
      ...taskRows.map((t) => {
        const project = projectRows.find((p) => p.id === t.projectId);
        return [
          "task",
          t.title,
          t.status,
          t.dueDate?.toISOString() ?? "",
          project?.name ?? "",
          t.createdAt.toISOString(),
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="planner-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="planner-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
