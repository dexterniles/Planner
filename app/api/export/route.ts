import { db } from "@/lib/db";
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
  SINGLE_USER_ID,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  const [
    workspaceRows,
    courseRows,
    assignmentRows,
    gradeCategoryRows,
    projectRows,
    taskRows,
    milestoneRows,
    timeLogRows,
    tagRows,
    inboxRows,
  ] = await Promise.all([
    db.select().from(workspaces).where(eq(workspaces.userId, SINGLE_USER_ID)),
    db.select().from(courses).where(eq(courses.userId, SINGLE_USER_ID)),
    db.select().from(assignments).where(eq(assignments.userId, SINGLE_USER_ID)),
    db.select().from(gradeCategories),
    db.select().from(projects).where(eq(projects.userId, SINGLE_USER_ID)),
    db.select().from(tasks).where(eq(tasks.userId, SINGLE_USER_ID)),
    db.select().from(milestones),
    db.select().from(timeLogs).where(eq(timeLogs.userId, SINGLE_USER_ID)),
    db.select().from(tags).where(eq(tags.userId, SINGLE_USER_ID)),
    db.select().from(inboxItems).where(eq(inboxItems.userId, SINGLE_USER_ID)),
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
    // Flatten into a simplified CSV of items
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
