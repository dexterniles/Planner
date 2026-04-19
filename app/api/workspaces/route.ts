import { db } from "@/lib/db";
import { workspaces, SINGLE_USER_ID } from "@/lib/db/schema";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, SINGLE_USER_ID))
    .orderBy(workspaces.sortOrder);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({ ...parsed.data, userId: SINGLE_USER_ID })
    .returning();

  return NextResponse.json(workspace, { status: 201 });
}
