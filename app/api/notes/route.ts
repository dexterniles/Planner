import { db } from "@/lib/db";
import { notes, SINGLE_USER_ID } from "@/lib/db/schema";
import { createNoteSchema } from "@/lib/validations/note";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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
    eq(notes.userId, SINGLE_USER_ID),
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
  const body = await request.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [note] = await db
    .insert(notes)
    .values({
      ...parsed.data,
      userId: SINGLE_USER_ID,
    })
    .returning();

  return NextResponse.json(note, { status: 201 });
}
