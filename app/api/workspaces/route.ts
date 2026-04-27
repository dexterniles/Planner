import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getWorkspaces } from "@/lib/server/data/workspaces";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const result = await getWorkspaces(auth.userId);
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
