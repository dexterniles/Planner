import { db } from "@/lib/db";
import { milestones, projects } from "@/lib/db/schema";
import { and, asc, eq, isNull } from "drizzle-orm";

export type MilestonesFilters = { projectId?: string };

export type MilestoneRow = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getMilestones(
  userId: string,
  opts: MilestonesFilters = {},
): Promise<MilestoneRow[]> {
  const { projectId } = opts;
  const conditions = [eq(projects.userId, userId)];
  if (projectId) conditions.push(eq(milestones.projectId, projectId));
  return db
    .select({
      id: milestones.id,
      projectId: milestones.projectId,
      title: milestones.title,
      description: milestones.description,
      targetDate: milestones.targetDate,
      completedAt: milestones.completedAt,
      createdAt: milestones.createdAt,
      updatedAt: milestones.updatedAt,
    })
    .from(milestones)
    .innerJoin(projects, eq(milestones.projectId, projects.id))
    .where(and(...conditions))
    .orderBy(milestones.targetDate);
}

export type UpcomingMilestone = {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  projectId: string;
  projectName: string;
  projectColor: string | null;
};

export async function getUpcomingMilestones(
  userId: string,
  limit: number,
): Promise<UpcomingMilestone[]> {
  return db
    .select({
      id: milestones.id,
      title: milestones.title,
      description: milestones.description,
      targetDate: milestones.targetDate,
      projectId: milestones.projectId,
      projectName: projects.name,
      projectColor: projects.color,
    })
    .from(milestones)
    .innerJoin(projects, eq(milestones.projectId, projects.id))
    .where(and(eq(projects.userId, userId), isNull(milestones.completedAt)))
    .orderBy(asc(milestones.targetDate))
    .limit(limit);
}
