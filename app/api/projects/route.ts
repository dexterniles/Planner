import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { createProjectSchema } from "@/lib/validations/project";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  const result = workspaceId
    ? await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.userId, userId),
            eq(projects.workspaceId, workspaceId),
          ),
        )
        .orderBy(projects.name)
    : await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(projects.name);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [project] = await db
    .insert(projects)
    .values({ ...parsed.data, userId })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
