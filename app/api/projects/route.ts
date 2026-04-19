import { db } from "@/lib/db";
import { projects, SINGLE_USER_ID } from "@/lib/db/schema";
import { createProjectSchema } from "@/lib/validations/project";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  const result = workspaceId
    ? await db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, workspaceId))
        .orderBy(projects.name)
    : await db
        .select()
        .from(projects)
        .where(eq(projects.userId, SINGLE_USER_ID))
        .orderBy(projects.name);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [project] = await db
    .insert(projects)
    .values({ ...parsed.data, userId: SINGLE_USER_ID })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
