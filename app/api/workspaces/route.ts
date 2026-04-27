import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const result = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .orderBy(workspaces.sortOrder);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({ ...parsed.data, userId })
    .returning();

  return NextResponse.json(workspace, { status: 201 });
}
