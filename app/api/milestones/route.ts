import { db } from "@/lib/db";
import { milestones, projects } from "@/lib/db/schema";
import { createMilestoneSchema } from "@/lib/validations/milestone";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 },
    );
  }

  const result = await db
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
    .where(
      and(eq(projects.userId, userId), eq(milestones.projectId, projectId)),
    )
    .orderBy(milestones.targetDate);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(eq(projects.id, parsed.data.projectId), eq(projects.userId, userId)),
    );
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const [milestone] = await db
    .insert(milestones)
    .values(parsed.data)
    .returning();

  return NextResponse.json(milestone, { status: 201 });
}
