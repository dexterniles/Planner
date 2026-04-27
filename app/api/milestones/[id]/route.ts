import { db } from "@/lib/db";
import { milestones, projects } from "@/lib/db/schema";
import { updateMilestoneSchema } from "@/lib/validations/milestone";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

async function userOwnsMilestone(id: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: milestones.id })
    .from(milestones)
    .innerJoin(projects, eq(milestones.projectId, projects.id))
    .where(and(eq(milestones.id, id), eq(projects.userId, userId)));
  return !!row;
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  if (!(await userOwnsMilestone(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json();
  const parsed = updateMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.completedAt !== undefined) {
    updateData.completedAt = parsed.data.completedAt
      ? new Date(parsed.data.completedAt)
      : null;
  }

  const [updated] = await db
    .update(milestones)
    .set(updateData)
    .where(eq(milestones.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  if (!(await userOwnsMilestone(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [deleted] = await db
    .delete(milestones)
    .where(eq(milestones.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
