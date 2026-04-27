import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { createNoteSchema } from "@/lib/validations/note";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const parentType = searchParams.get("parentType");
  const parentId = searchParams.get("parentId");

  if (!parentType) {
    return NextResponse.json(
      { error: "parentType is required" },
      { status: 400 },
    );
  }

  const conditions = [
    eq(notes.userId, userId),
    eq(
      notes.parentType,
      parentType as
        | "course"
        | "project"
        | "assignment"
        | "task"
        | "session"
        | "daily_log"
        | "standalone"
        | "event",
    ),
  ];
  if (parentId) conditions.push(eq(notes.parentId, parentId));

  const result = await db
    .select()
    .from(notes)
    .where(and(...conditions))
    .orderBy(desc(notes.updatedAt));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [note] = await db
    .insert(notes)
    .values({
      ...parsed.data,
      userId,
    })
    .returning();

  return NextResponse.json(note, { status: 201 });
}
