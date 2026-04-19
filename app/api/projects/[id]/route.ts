import { db } from "@/lib/db";
import { projects, SINGLE_USER_ID } from "@/lib/db/schema";
import { updateProjectSchema } from "@/lib/validations/project";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, SINGLE_USER_ID)));

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(projects)
    .set(parsed.data)
    .where(and(eq(projects.id, id), eq(projects.userId, SINGLE_USER_ID)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const [deleted] = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, SINGLE_USER_ID)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
