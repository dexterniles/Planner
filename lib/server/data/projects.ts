import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type Project = InferSelectModel<typeof projects>;

export type ProjectsFilters = { workspaceId?: string };

export async function getProjects(
  userId: string,
  opts: ProjectsFilters = {},
): Promise<Project[]> {
  const { workspaceId } = opts;
  if (workspaceId) {
    return db
      .select()
      .from(projects)
      .where(
        and(eq(projects.userId, userId), eq(projects.workspaceId, workspaceId)),
      )
      .orderBy(projects.name);
  }
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(projects.name);
}

export async function getProjectById(
  userId: string,
  projectId: string,
): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  return project ?? null;
}
