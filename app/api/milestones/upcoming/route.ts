import { db } from "@/lib/db";
import { milestones, projects } from "@/lib/db/schema";
import { and, eq, isNull, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "3", 10);

  const result = await db
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
    .where(
      and(eq(projects.userId, userId), isNull(milestones.completedAt)),
    )
    .orderBy(asc(milestones.targetDate))
    .limit(limit);

  return NextResponse.json(result);
}
