import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { createNoteSchema } from "@/lib/validations/note";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getNotes, type NoteParentType } from "@/lib/server/data/notes";

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

  const result = await getNotes(
    userId,
    parentType as NoteParentType,
    parentId ?? undefined,
  );
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
