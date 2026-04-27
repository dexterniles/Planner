import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type Workspace = InferSelectModel<typeof workspaces>;

export async function getWorkspaces(userId: string): Promise<Workspace[]> {
  return db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .orderBy(workspaces.sortOrder);
}

export async function getWorkspaceById(
  userId: string,
  id: string,
): Promise<Workspace | null> {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)));
  return workspace ?? null;
}
